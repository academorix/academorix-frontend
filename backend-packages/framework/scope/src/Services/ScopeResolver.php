<?php

/**
 * @file src/Services/ScopeResolver.php
 *
 * @description
 * Concrete implementation of {@see ScopeResolutionInterface}. Owns
 * the cascading read path — given the active context's ancestor
 * chain, run one indexed SELECT to fetch every stored value along
 * the chain for a namespace, order by descending depth, and pick
 * the first hit per key.
 *
 * Writes are simpler: upsert `scope_values` at the target node.
 */

declare(strict_types=1);

namespace Academorix\Scope\Services;

use Academorix\Scope\Contracts\ScopeContextInterface;
use Academorix\Scope\Contracts\ScopeRegistryInterface;
use Academorix\Scope\Contracts\ScopeResolutionInterface;
use Academorix\Scope\Data\ResolvedScopeValue;
use Academorix\Scope\Exceptions\ScopeValidationException;
use Academorix\Scope\Models\ScopeNode;
use Academorix\Scope\Models\ScopeValue;

/**
 * Cascading resolver.
 *
 * ## Read algorithm — `resolve()`
 *
 *   1. Read the ancestor chain from the active context
 *      (`materialised_path`). No DB round-trip — the middleware
 *      already loaded it.
 *   2. Build a rank map of `node_id → depth in the path` so the
 *      SQL result can be re-sorted in PHP without another query.
 *   3. SELECT * FROM scope_values
 *        WHERE scope_node_id IN (<ancestor ids>)
 *          AND namespace = ?
 *          AND key = ?.
 *   4. Order the returned rows by the rank map (leaf first).
 *   5. Return the first row's value, tagged with the source node.
 *   6. On empty result, invoke the consumer's default factory.
 *
 * ## Read algorithm — `resolveMany()`
 *
 * Same shape, but with an additional `key LIKE ?%` clause and a
 * per-key dedupe pass in PHP. One SELECT for the whole prefix
 * subtree.
 *
 * ## Per-request memoisation
 *
 * Both methods maintain an in-memory cache keyed by
 * `(namespace, key)` (or `(namespace, prefix)`) for the current
 * request. `#[Scoped]` on the interface ensures the memo empties
 * between requests.
 */
final class ScopeResolver implements ScopeResolutionInterface
{
    /**
     * Per-request memo — `namespace|key` → ResolvedScopeValue.
     *
     * @var array<string, ResolvedScopeValue>
     */
    private array $memo = [];

    /**
     * Per-request memo for prefix reads.
     *
     * @var array<string, array<string, ResolvedScopeValue>>
     */
    private array $memoMany = [];

    public function __construct(
        private readonly ScopeContextInterface $context,
        private readonly ScopeRegistryInterface $registry,
    ) {}

    public function resolve(string $namespace, string $key): ResolvedScopeValue
    {
        $memoKey = $namespace.'|'.$key;

        if (isset($this->memo[$memoKey])) {
            return $this->memo[$memoKey];
        }

        $ctx = $this->context->getOrFail();
        $ancestorIds = $ctx->ancestorIds();

        // Rank map — leaf has the highest rank so it's selected first.
        $rankByNodeId = array_flip(array_reverse($ancestorIds));

        /** @var list<ScopeValue> $rows */
        $rows = ScopeValue::query()
            ->whereIn(ScopeValue::ATTR_SCOPE_NODE_ID, $ancestorIds)
            ->where(ScopeValue::ATTR_NAMESPACE, $namespace)
            ->where(ScopeValue::ATTR_KEY, $key)
            ->get()
            ->all();

        // Sort in-PHP by rank — descending rank = closest ancestor
        // to the leaf.
        usort(
            $rows,
            static fn (ScopeValue $a, ScopeValue $b): int => ($rankByNodeId[$b->scope_node_id] ?? -1) <=> ($rankByNodeId[$a->scope_node_id] ?? -1),
        );

        if ($rows !== []) {
            $row = $rows[0];
            $node = $row->node;

            $this->memo[$memoKey] = new ResolvedScopeValue(
                value: $row->value,
                namespace: $namespace,
                key: $key,
                sourceNodeId: (string) $row->scope_node_id,
                sourceScopeSlug: $node->scope_slug ?? null,
                isDefault: false,
            );

            return $this->memo[$memoKey];
        }

        // Fall back to the consumer's default factory.
        return $this->memo[$memoKey] = new ResolvedScopeValue(
            value: $this->defaultFor($namespace, $key),
            namespace: $namespace,
            key: $key,
            sourceNodeId: null,
            sourceScopeSlug: null,
            isDefault: true,
        );
    }

    public function resolveMany(string $namespace, string $prefix = ''): array
    {
        $memoKey = $namespace.'|prefix|'.$prefix;

        if (isset($this->memoMany[$memoKey])) {
            return $this->memoMany[$memoKey];
        }

        $ctx = $this->context->getOrFail();
        $ancestorIds = $ctx->ancestorIds();

        $rankByNodeId = array_flip(array_reverse($ancestorIds));

        $query = ScopeValue::query()
            ->whereIn(ScopeValue::ATTR_SCOPE_NODE_ID, $ancestorIds)
            ->where(ScopeValue::ATTR_NAMESPACE, $namespace);

        if ($prefix !== '') {
            // LIKE against a prefix — escape any wildcard characters
            // in the prefix itself so `foo_` doesn't accidentally
            // match `foobar`.
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $prefix);
            $query->where(ScopeValue::ATTR_KEY, 'like', $escaped.'%');
        }

        /** @var list<ScopeValue> $rows */
        $rows = $query->get()->all();

        // Sort so the closest-to-leaf ancestor is first per key.
        usort(
            $rows,
            static fn (ScopeValue $a, ScopeValue $b): int => ($rankByNodeId[$b->scope_node_id] ?? -1) <=> ($rankByNodeId[$a->scope_node_id] ?? -1),
        );

        $winners = [];
        foreach ($rows as $row) {
            // First seen = first won because of the pre-sort.
            if (isset($winners[$row->key])) {
                continue;
            }
            $winners[$row->key] = new ResolvedScopeValue(
                value: $row->value,
                namespace: $namespace,
                key: $row->key,
                sourceNodeId: (string) $row->scope_node_id,
                sourceScopeSlug: $row->node->scope_slug ?? null,
                isDefault: false,
            );
        }

        return $this->memoMany[$memoKey] = $winners;
    }

    public function write(
        string $namespace,
        ScopeNode $node,
        string $key,
        mixed $value,
        ?string $updatedBy = null,
    ): void {
        $config = $this->registry->get($namespace);
        if ($config === null) {
            throw ScopeValidationException::rejectedByValidator($namespace, $key);
        }

        if ($config->validator !== null && ($config->validator)($value, $key) !== true) {
            throw ScopeValidationException::rejectedByValidator($namespace, $key);
        }

        // Upsert — one row per (node, namespace, key).
        ScopeValue::query()->updateOrCreate(
            attributes: [
                ScopeValue::ATTR_SCOPE_NODE_ID => $node->getKey(),
                ScopeValue::ATTR_NAMESPACE => $namespace,
                ScopeValue::ATTR_KEY => $key,
            ],
            values: [
                ScopeValue::ATTR_VALUE => $value,
                ScopeValue::ATTR_UPDATED_BY => $updatedBy,
            ],
        );

        // Invalidate memos for this key so subsequent reads within
        // the same request see the new value.
        unset($this->memo[$namespace.'|'.$key]);
        // Prefix memos are dropped entirely — cheaper than trying
        // to figure out which prefixes might have matched.
        foreach (array_keys($this->memoMany) as $memoKey) {
            if (str_starts_with($memoKey, $namespace.'|prefix|')) {
                unset($this->memoMany[$memoKey]);
            }
        }
    }

    public function forget(string $namespace, ScopeNode $node, string $key): bool
    {
        $deleted = ScopeValue::query()
            ->where(ScopeValue::ATTR_SCOPE_NODE_ID, $node->getKey())
            ->where(ScopeValue::ATTR_NAMESPACE, $namespace)
            ->where(ScopeValue::ATTR_KEY, $key)
            ->delete();

        // Same memo housekeeping as write().
        unset($this->memo[$namespace.'|'.$key]);
        foreach (array_keys($this->memoMany) as $memoKey) {
            if (str_starts_with($memoKey, $namespace.'|prefix|')) {
                unset($this->memoMany[$memoKey]);
            }
        }

        return $deleted > 0;
    }

    /**
     * Invoke the consumer's default-value factory. Falls back to
     * `null` when no factory was registered.
     */
    private function defaultFor(string $namespace, string $key): mixed
    {
        $config = $this->registry->get($namespace);
        if ($config?->defaultValueFactory === null) {
            return null;
        }

        return ($config->defaultValueFactory)($key);
    }
}
