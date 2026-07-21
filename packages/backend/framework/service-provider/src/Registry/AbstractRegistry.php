<?php

declare(strict_types=1);

namespace Stackra\ServiceProvider\Registry;

use Stackra\AI\Registry\AgentMiddlewareRegistry;
use Stackra\Retention\Registry\RetentionPolicyRegistry;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Illuminate\Support\Collection;

/**
 * Shared base for every attribute-driven registry in the monorepo.
 *
 * ## What this class owns
 *
 *  * The `key → priority` map every registry needs — where `key`
 *    is a class-string, a slug, a tool name, or any other stable
 *    domain identifier. Storage is a pure PHP `array` keyed by the
 *    string identifier; the value is the caller-supplied priority.
 *  * The insertion-cursor tie-breaker map — same keys, values are
 *    a monotonically increasing cursor captured on the FIRST call
 *    to {@see register()}. When two entries share a priority the
 *    cursor decides ordering, which keeps {@see all()} STABLE
 *    across boots and cache hashes.
 *  * The metadata slot — an optional arbitrary payload attached to
 *    each key. Subclasses hand a domain-typed value (a descriptor
 *    VO, a wire slug, an attribute instance) as the third argument
 *    to {@see register()}; readers pull it back via
 *    {@see metadataOf()} or via the {@see entries()} struct
 *    iterator.
 *  * The memoized {@see all()} result — the priority sort runs
 *    exactly ONCE per registration cycle. Every subsequent
 *    `all()` call returns the same array reference until a
 *    {@see register()} or {@see clear()} invalidates the memo.
 *  * The {@see resolvePriorityFor()} hook — subclasses that want
 *    to derive a priority from the key alone (e.g. attribute
 *    inspection, container instance introspection) override this
 *    method. The base is a pass-through that returns the
 *    caller-supplied priority as-is.
 *  * The {@see collect()} bridge — allocates a fresh Laravel
 *    {@see Collection} per call for callers who want the fluent
 *    API. The Collection is NOT memoized (see the perf rationale
 *    below).
 *
 * ## Perf rationale — pure arrays + memoized sort
 *
 * Every concrete registry in the codebase carries `#[Singleton]`
 * — populated ONCE at framework boot, read many times per
 * request. Extending `Illuminate\Support\Collection` would
 * allocate a new sorted Collection on every read (~15 hot-path
 * reads per request × N Octane workers = measurable GC
 * pressure). Pure PHP arrays keep every read O(1) after the
 * first sort, and the `usort()` call runs exactly once per
 * registration cycle regardless of how many `all()` callers
 * touch the registry afterwards.
 *
 * The `collect()` accessor covers the rare fluent-API use case
 * without paying the allocation cost on every hot-path read.
 *
 * ## Concrete subclass shapes
 *
 *  * **Pure class-string catalogue** — the base's `key` is the
 *    class-string itself, no metadata attached. Subclass adds
 *    nothing but its identity — see {@see AgentMiddlewareRegistry}
 *    or `TenancyHookRegistry`.
 *  * **Keyed catalogue with metadata** — the base's `key` is a
 *    domain identifier (retention policy key, persona slug, tool
 *    name); the subclass hands a domain-typed payload
 *    (descriptor, class-string, attribute instance) as the
 *    `metadata` argument to {@see register()}. Consumers pull it
 *    back via {@see metadataOf()} or iterate every record via
 *    {@see entries()}. See {@see RetentionPolicyRegistry} for
 *    the canonical example.
 *  * **Bespoke priority derivation** — subclasses that need to
 *    consult attributes, container instances, or config to
 *    compute a priority override {@see resolvePriorityFor()} and
 *    call it from their own `register()` override.
 *
 * ## Idempotency contract
 *
 * A duplicate {@see register()} call for a key already present
 * is a NO-OP — never throws, never re-stamps the insertion
 * cursor, never overwrites metadata. This keeps two-track
 * registration (explicit array on a provider + `#[AsX]` attribute
 * discovery) safe to converge on the same key without racing on
 * ordering. Subclasses that need collision diagnostics (e.g.
 * `RetentionPolicyRegistry` which throws on duplicate keys
 * because two model classes cannot share a retention identifier)
 * detect the collision BEFORE delegating to `parent::register()`.
 *
 * ## Octane safety
 *
 * The registry itself is stateless between requests once
 * populated — every mutation happens at framework boot inside a
 * bootstrapper. Reads under Octane hit the memoized sorted array
 * with zero allocations. The `$sortedKeys` memo is invalidated
 * only by `register()` / `clear()`; both operations run
 * exclusively at boot in production.
 *
 * @see AbstractBootstrapper Populates subclasses.
 * @see Collection Fluent bridge for consumers that want it.
 *
 * @category ServiceProvider
 *
 * @since    0.1.0
 */
abstract class AbstractRegistry
{
    /**
     * Default priority applied when neither the caller nor a
     * subclass's {@see resolvePriorityFor()} override supplies a
     * more specific value.
     *
     * Sits at the start of the domain-module band per
     * `.kiro/steering/bootstrappers.md` so a registry that
     * forgets to override still lands in a reasonable slot.
     */
    public const int DEFAULT_PRIORITY = 100;

    /**
     * `key → priority` map. Populated by {@see register()}.
     *
     * The `key` semantics are subclass-defined — it may be a
     * class-string, a slug, a wire name, or any other stable
     * string identifier. Priority is the value returned by
     * {@see resolvePriorityFor()} — the caller's argument by
     * default, or a subclass-computed override.
     * Lower priorities sort earlier under {@see all()}.
     *
     * @var array<string, int>
     */
    protected array $priorities = [];

    /**
     * `key → insertion-cursor` map. Populated by {@see register()}
     * on the FIRST call for a given key; subsequent duplicate
     * `register()` calls are idempotent and DO NOT re-stamp the
     * cursor.
     *
     * The cursor breaks priority ties in {@see all()} so ordering
     * stays stable across boots even when two entries share a
     * priority — sort by priority ASC, then by cursor ASC.
     *
     * @var array<string, int>
     */
    protected array $order = [];

    /**
     * `key → arbitrary metadata payload` map. Populated when
     * {@see register()} is called with a non-null third argument.
     *
     * The stored value is subclass-defined — a descriptor VO, a
     * class-string, an attribute instance, a wire slug. `null`
     * (the default) means "no metadata for this key"; readers
     * fall back to `null` via {@see metadataOf()} when a key was
     * registered without a payload.
     *
     * @var array<string, mixed>
     */
    protected array $metadata = [];

    /**
     * Monotonic counter feeding {@see $order} — captures the
     * global registration sequence within a boot.
     */
    protected int $cursor = 0;

    /**
     * Memoized {@see all()} result. `null` means "recompute on
     * the next call"; a `list<string>` means "reuse this
     * reference".
     *
     * Invalidated to `null` on every {@see register()} and
     * {@see clear()} invocation.
     *
     * @var list<string>|null
     */
    private ?array $sortedKeys = null;

    /**
     * Register `$key` under `$priority` with optional
     * `$metadata` — idempotent.
     *
     * A second call for the same `$key` is a NO-OP; the priority
     * stays at the first-call value, the insertion cursor is NOT
     * re-stamped, and the metadata is NOT overwritten. This keeps
     * two-track registration (explicit array on a provider +
     * `#[AsX]` attribute discovery) safe to converge on the same
     * key without racing on ordering.
     *
     * Subclasses that need to derive the priority from `$key`
     * alone override {@see resolvePriorityFor()} — the hook is
     * consulted here BEFORE the key is stamped, so the stored
     * priority is always the resolved value.
     *
     * Invalidates the {@see $sortedKeys} memo so the next
     * {@see all()} call re-sorts and re-caches.
     *
     * @param  string  $key
     *                       Stable identifier — subclass-defined semantics
     *                       (class-string, slug, tool name, ...). Duplicate
     *                       calls are idempotent.
     * @param  int  $priority
     *                         Execution priority — LOWER runs first under
     *                         {@see all()}. Defaults to
     *                         {@see self::DEFAULT_PRIORITY} (the domain-module
     *                         band start). Subclasses that override
     *                         {@see resolvePriorityFor()} may transform this
     *                         value before it lands on {@see $priorities}.
     * @param  mixed  $metadata
     *                           Optional arbitrary payload attached to
     *                           `$key` — accessible later via
     *                           {@see metadataOf()} or the {@see entries()}
     *                           struct iterator. Pass `null` (default) when
     *                           the registry stores no per-key metadata.
     */
    public function register(string $key, int $priority = self::DEFAULT_PRIORITY, mixed $metadata = null): void
    {
        if (isset($this->priorities[$key])) {
            return;
        }

        $this->priorities[$key] = $this->resolvePriorityFor($key, $priority);
        $this->order[$key] = $this->cursor++;

        if ($metadata !== null) {
            $this->metadata[$key] = $metadata;
        }

        $this->sortedKeys = null;
    }

    /**
     * Hook for subclasses to derive a priority from `$key`.
     *
     * The base is a pass-through — it returns `$providedPriority`
     * as-is. Subclasses override this method to consult attribute
     * annotations, container instances, config, or any other
     * source that can produce a priority for a specific key. The
     * override is called from {@see register()} BEFORE the key is
     * stamped, so whatever the subclass returns becomes the
     * stored priority.
     *
     * ## Contract for overrides
     *
     *  * Return the resolved priority as an `int`. Callers must
     *    NEVER receive `null` from this method.
     *  * Do not throw — a broken derivation MUST fall back to
     *    `$providedPriority` so registration continues.
     *  * Honour the caller's explicit priority when the derivation
     *    finds nothing — that keeps back-compat with callers who
     *    hand-tune priorities in tests.
     *
     * @param  string  $key
     *                       Stable identifier the caller passed to
     *                       {@see register()}.
     * @param  int  $providedPriority
     *                                 Priority argument the caller supplied.
     * @return int Resolved priority — the value that lands on
     *             {@see $priorities}.
     */
    protected function resolvePriorityFor(string $key, int $providedPriority): int
    {
        return $providedPriority;
    }

    /**
     * Every registered key, sorted by priority ASC and ties broken
     * by insertion order (STABLE sort — first-registered wins).
     *
     * The sort runs exactly ONCE per registration cycle — the
     * result is memoized on the {@see $sortedKeys} slot and every
     * subsequent call returns the SAME array reference until
     * {@see register()} or {@see clear()} invalidates the memo.
     * See the class docblock for the perf rationale.
     *
     * @return list<string> Priority-ordered keys — never
     *                      `iterable`; consumers expect a plain
     *                      array for the hot path.
     */
    public function all(): array
    {
        if ($this->sortedKeys !== null) {
            return $this->sortedKeys;
        }

        $keys = array_keys($this->priorities);

        usort(
            $keys,
            function (string $a, string $b): int {
                $delta = $this->priorities[$a] <=> $this->priorities[$b];

                return $delta !== 0 ? $delta : ($this->order[$a] <=> $this->order[$b]);
            },
        );

        /** @var list<string> $keys */
        $this->sortedKeys = $keys;

        return $this->sortedKeys;
    }

    /**
     * Every registered key, sorted by priority DESC (symmetric
     * teardown order).
     *
     * Wraps {@see all()} + `array_reverse()` so the ascending
     * memo does the heavy lifting; the reversed variant allocates
     * a new array per call but only reads the memoized `all()`
     * result — no additional sort. Tenancy-hook end callbacks and
     * anything else that unwinds in the opposite direction use
     * this accessor.
     *
     * @return list<string> Reverse-priority keys — safe for
     *                      symmetric teardown semantics.
     */
    public function allReversed(): array
    {
        /** @var list<string> $reversed */
        $reversed = array_reverse($this->all());

        return $reversed;
    }

    /**
     * Iterate every registered record as a full struct.
     *
     * Returns entries in the SAME order as {@see all()} — priority
     * ASC with insertion cursor tie-break. Each yielded record
     * carries the key, the resolved priority, and the metadata
     * payload (or `null` when none was set). Admin surfaces +
     * diagnostic dumps use this method when they need the full
     * shape rather than just keys.
     *
     * @return list<array{key: string, priority: int, metadata: mixed}>
     */
    public function entries(): array
    {
        $records = [];

        foreach ($this->all() as $key) {
            $records[] = [
                'key' => $key,
                'priority' => $this->priorities[$key],
                'metadata' => $this->metadata[$key] ?? null,
            ];
        }

        return $records;
    }

    /**
     * Whether `$key` has been registered.
     *
     * @param  string  $key  Stable identifier — subclass-defined semantics.
     * @return bool `true` when the key is present, `false` otherwise.
     */
    public function has(string $key): bool
    {
        return isset($this->priorities[$key]);
    }

    /**
     * Number of registered keys. Used by smoke tests, boot-time
     * summary logs, and admin surfaces.
     *
     * @return int Non-negative count.
     */
    public function count(): int
    {
        return \count($this->priorities);
    }

    /**
     * Resolved priority of `$key`, or `null` when the key is not
     * registered.
     *
     * The value returned is whatever {@see resolvePriorityFor()}
     * produced at registration time — a subclass override may
     * have transformed the caller-supplied priority into
     * something else.
     *
     * @param  string  $key  Stable identifier — subclass-defined semantics.
     * @return int|null Priority when registered, `null` otherwise.
     */
    public function priorityOf(string $key): ?int
    {
        return $this->priorities[$key] ?? null;
    }

    /**
     * Metadata payload attached to `$key` at registration, or
     * `null` when the key is not registered OR was registered
     * without a payload.
     *
     * Subclasses whose metadata type is domain-specific typically
     * add a typed convenience accessor (e.g.
     * `RetentionPolicyRegistry::resolve(): ?RetentionPolicyDescriptor`)
     * that wraps this method with a cast.
     *
     * @param  string  $key  Stable identifier — subclass-defined semantics.
     * @return mixed Metadata payload when set, `null` otherwise.
     */
    public function metadataOf(string $key): mixed
    {
        return $this->metadata[$key] ?? null;
    }

    /**
     * Reset the registry — clears every entry, every insertion
     * cursor, every metadata payload, the cursor counter, and the
     * sort memo.
     *
     * Used exclusively by tests (isolate one boot's registrations
     * from another) and by `bootstrap:clear` when the operator
     * asks for a full state wipe. Production code MUST NOT call
     * this at request time — the registry is a `#[Singleton]`
     * shared across every request in an Octane worker.
     */
    public function clear(): void
    {
        $this->priorities = [];
        $this->order = [];
        $this->metadata = [];
        $this->cursor = 0;
        $this->sortedKeys = null;
    }

    /**
     * Fluent bridge — return the memoized {@see all()} result
     * wrapped in a fresh Laravel {@see Collection}.
     *
     * The Collection is NOT memoized — every call allocates a
     * new instance so mutations on the returned Collection can
     * never leak back into the shared registry. Prefer
     * {@see all()} on the hot path; reach for `collect()` only
     * when a specific consumer genuinely wants the fluent API
     * (admin surfaces, one-shot filters, test assertions).
     *
     * @return Collection<int, string> A NEW Collection instance
     *                                 per call. Iterates in the
     *                                 same priority order as
     *                                 {@see all()}.
     */
    public function collect(): Collection
    {
        return new Collection($this->all());
    }
}
