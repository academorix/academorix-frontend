<?php

declare(strict_types=1);

namespace Academorix\Retention\Registry;

use Academorix\Retention\Support\RetentionPolicyDescriptor;
use Academorix\ServiceProvider\Registry\AbstractRegistry;
use Illuminate\Container\Attributes\Singleton;
use LogicException;

/**
 * `key → RetentionPolicyDescriptor` catalogue populated by
 * discovery.
 *
 * ## What this class owns
 *
 *  * The base priority map (via {@see AbstractRegistry}) — `key`
 *    is the policy's stable identifier (e.g. `ai.run`,
 *    `notification.digest`) and the associated priority governs
 *    execution order under {@see all()}. Retention policies do
 *    not currently declare per-policy priorities; every entry
 *    lands at the shared default which keeps registration order
 *    as the effective ordering (stable-sort tie-breaker on the
 *    insertion cursor).
 *  * The `RetentionPolicyDescriptor` domain payload stored on the
 *    base's metadata slot via
 *    `parent::register($descriptor->key, $priority, $descriptor)`.
 *    Consumers pull it back through {@see resolve()} /
 *    {@see find()} which wrap
 *    {@see AbstractRegistry::metadataOf()} with a cast.
 *  * The duplicate-key guard that throws {@see LogicException}
 *    at boot on collisions — the base's silent-idempotent
 *    behaviour is overridden here because a duplicate retention
 *    key is a code-time bug (two model classes chose the same
 *    identifier) rather than a benign two-track registration
 *    convergence.
 *
 * ## Two-map pattern
 *
 * Every operation on this registry updates the base's two slots
 * (priority + metadata) atomically:
 *
 *   * {@see registerDescriptor()} guards against duplicates, then
 *     delegates to `parent::register($descriptor->key, $priority,
 *     $descriptor)` — a single call updates both slots and
 *     invalidates the sort memo.
 *   * {@see resolve()} + {@see find()} read the metadata slot.
 *   * {@see descriptors()} zips the base's priority-sorted key
 *     list against the metadata slot to return descriptors in
 *     execution order.
 *   * {@see all()} (inherited) still returns the key list — the
 *     shared, hot-path accessor for callers that only need
 *     identifiers.
 *
 * The domain-facing registration method is called
 * {@see registerDescriptor()} rather than `register()` so the
 * subclass surface stays LSP-compatible with the base's
 * three-arg {@see AbstractRegistry::register()} signature.
 *
 * ## Perf notes
 *
 * Extends {@see AbstractRegistry} to inherit the memoized sort +
 * Octane-safe pure-array storage. `descriptors()` allocates a
 * small array per call but reads the memoized key order — the
 * expensive `usort()` happens exactly once per registration
 * cycle regardless of caller.
 *
 * ## Octane-safe binding
 *
 * `#[Singleton]` — the registry carries no per-request state.
 * Every entry is a `RetentionPolicyDescriptor` captured at
 * discovery time and immutable thereafter.
 *
 * @see RetentionPolicyDescriptor The readonly VO stored on the metadata slot.
 * @see AbstractRegistry          Shared base — pure arrays + memoized sort.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[Singleton]
final class RetentionPolicyRegistry extends AbstractRegistry
{
    /**
     * Default priority for retention policies that do not declare
     * their own. Sits in the domain-module band; the effective
     * ordering falls back to insertion order.
     */
    public const int DEFAULT_POLICY_PRIORITY = 100;

    /**
     * Register a discovered policy.
     *
     * Duplicate keys throw {@see LogicException} at boot — two
     * classes competing for the same identifier is a code-time
     * bug that operator dashboards cannot resolve at runtime.
     * The exception message names BOTH offending model classes so
     * the fix is obvious.
     *
     * @param  RetentionPolicyDescriptor  $descriptor  Descriptor emitted by discovery.
     * @param  int  $priority
     *                         Execution priority — lower runs first under
     *                         {@see all()}. Defaults to
     *                         {@see self::DEFAULT_POLICY_PRIORITY}.
     *
     * @throws LogicException When a descriptor with the same `key` is already registered.
     */
    public function registerDescriptor(
        RetentionPolicyDescriptor $descriptor,
        int $priority = self::DEFAULT_POLICY_PRIORITY,
    ): void {
        if ($this->has($descriptor->key)) {
            $existing = $this->metadataOf($descriptor->key);
            $existingModel = $existing instanceof RetentionPolicyDescriptor
                ? $existing->modelClass
                : '<unknown>';

            throw new LogicException(sprintf(
                'Duplicate retention policy key "%s" — %s already registered; %s tried to register the same key. Rename one of them so operator dashboards can address each policy uniquely.',
                $descriptor->key,
                $existingModel,
                $descriptor->modelClass,
            ));
        }

        parent::register($descriptor->key, $priority, $descriptor);
    }

    /**
     * Resolve a descriptor by `key`, or `null` when unregistered.
     *
     * Reads the metadata slot via
     * {@see AbstractRegistry::metadataOf()} and casts back to the
     * domain type. The name matches the user-prompt playbook
     * language — every registry surfaces the domain-typed
     * accessor via `resolve()` when its metadata payload is the
     * primary lookup shape.
     *
     * @param  string  $key  Policy identifier — matches `#[AsRetentionPolicy(key)]`.
     * @return RetentionPolicyDescriptor|null Descriptor when present.
     */
    public function resolve(string $key): ?RetentionPolicyDescriptor
    {
        $descriptor = $this->metadataOf($key);

        return $descriptor instanceof RetentionPolicyDescriptor ? $descriptor : null;
    }

    /**
     * Alias for {@see resolve()} — historical name kept for
     * callers that expect a `find()`-style accessor.
     *
     * @param  string  $key  Policy identifier.
     * @return RetentionPolicyDescriptor|null Descriptor when present.
     */
    public function find(string $key): ?RetentionPolicyDescriptor
    {
        return $this->resolve($key);
    }

    /**
     * Alias for {@see resolve()} — matches the historical
     * `get()`-style accessor used by earlier retention consumers.
     *
     * @param  string  $key  Policy identifier.
     * @return RetentionPolicyDescriptor|null Descriptor when present.
     */
    public function get(string $key): ?RetentionPolicyDescriptor
    {
        return $this->resolve($key);
    }

    /**
     * Return every registered descriptor in priority-ASC order
     * (ties broken by insertion cursor).
     *
     * Reads the memoized key order from the base's {@see all()}
     * and hands each key through {@see resolve()}. The heavy sort
     * runs exactly ONCE per registration cycle regardless of
     * caller.
     *
     * @return list<RetentionPolicyDescriptor> Descriptors in
     *                                         execution order.
     */
    public function descriptors(): array
    {
        $out = [];

        foreach ($this->all() as $key) {
            $descriptor = $this->resolve($key);
            if ($descriptor !== null) {
                $out[] = $descriptor;
            }
        }

        return $out;
    }
}
