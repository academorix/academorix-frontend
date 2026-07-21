<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Support;

use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Scope\Models\ScopeDefinition;
use Stackra\Scope\Models\ScopeNode;

/**
 * Snapshot of the caller's active `(scope_level, scope_value)` chain.
 *
 * Consumed by every resolver layer (`KillSwitchLayer`,
 * `OverrideLayer`, `RolloutLayer`) through the three accessors
 * {@see valueAt()}, {@see deepestLevel()}, {@see sortedLevels()}.
 * Hydrated once per evaluation by the checker (Task 8.2) via
 * {@see fromScopeContext()} — every downstream layer reads the
 * same frozen snapshot without re-querying the scope framework.
 *
 * Local to this package because `stackra/scope` does not ship
 * a first-class `ScopePath` VO today. See
 * `docs/scope-integration.md`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final readonly class ScopePath
{
    /**
     * @param  array<string, string>  $levelToValue  Map of `scope_level` slug → concrete entity id at that level.
     * @param  array<string, int>     $sortOrders    Map of `scope_level` slug → `sort_order` on `scope_definitions`.
     */
    public function __construct(
        public array $levelToValue,
        public array $sortOrders,
    ) {}

    /**
     * Return the concrete `scope_value` at `$level`, or null when not on the caller's path.
     *
     * @param  string  $level  Scope slug drawn from `scope_definitions.slug`.
     * @return string|null
     */
    public function valueAt(string $level): ?string
    {
        return $this->levelToValue[$level] ?? null;
    }

    /**
     * Return the slug of the deepest level on the caller's active path.
     *
     * Empty string when the path is empty — diagnostic callers surface it as "no active scope".
     *
     * @return string
     */
    public function deepestLevel(): string
    {
        if ($this->levelToValue === []) {
            return '';
        }

        $deepest = '';
        $deepestOrder = PHP_INT_MIN;
        foreach (array_keys($this->levelToValue) as $level) {
            $order = $this->sortOrders[$level] ?? PHP_INT_MIN;
            if ($order > $deepestOrder) {
                $deepestOrder = $order;
                $deepest = $level;
            }
        }

        return $deepest;
    }

    /**
     * Return the full `scope_level → sort_order` map for deepest-wins ordering.
     *
     * Read-only view. Consumers pass it into `usort()` keyed off the
     * `scope_level` column of candidate rows.
     *
     * @return array<string, int>
     */
    public function sortedLevels(): array
    {
        return $this->sortOrders;
    }

    /**
     * Presence check — return true when `$level` is on the caller's active path.
     *
     * @param  string  $level  Scope slug to test.
     * @return bool
     */
    public function has(string $level): bool
    {
        return array_key_exists($level, $this->levelToValue);
    }

    /**
     * Hydrate a `ScopePath` from the scope framework's active request context.
     *
     * Two queries: one on `scope_nodes` (ancestor node chain), one
     * on `scope_definitions` (sort_order table). Falls through to
     * {@see empty()} when no scope has been established.
     *
     * @param  ScopeContextInterface  $context  Request-scoped scope holder.
     * @return self
     */
    public static function fromScopeContext(ScopeContextInterface $context): self
    {
        $active = $context->get();
        if ($active === null) {
            return self::empty();
        }

        $ancestorIds = $active->ancestorIds();

        /** @var array<string, int> $sortOrders */
        $sortOrders = ScopeDefinition::query()
            ->where(ScopeDefinition::ATTR_OWNER_ID, $active->ownerId)
            ->pluck(ScopeDefinition::ATTR_SORT_ORDER, ScopeDefinition::ATTR_SLUG)
            ->all();

        $ancestorNodes = ScopeNode::query()
            ->whereIn(ScopeNode::PRIMARY_KEY, $ancestorIds)
            ->get()
            ->keyBy(ScopeNode::PRIMARY_KEY);

        $levelToValue = [];
        foreach ($ancestorIds as $id) {
            $node = $ancestorNodes->get($id);
            if (! $node instanceof ScopeNode) {
                continue;
            }
            $levelToValue[(string) $node->scope_slug] = (string) $node->entity_id;
        }

        $normalisedSortOrders = [];
        foreach ($sortOrders as $slug => $order) {
            $normalisedSortOrders[(string) $slug] = (int) $order;
        }

        return new self(levelToValue: $levelToValue, sortOrders: $normalisedSortOrders);
    }

    /**
     * Return the empty `ScopePath` — both maps are `[]`.
     *
     * Consumed when the caller has no resolved scope (console
     * command, queue worker without request context). Every
     * accessor returns a clean empty result.
     *
     * @return self
     */
    public static function empty(): self
    {
        return new self(levelToValue: [], sortOrders: []);
    }
}
