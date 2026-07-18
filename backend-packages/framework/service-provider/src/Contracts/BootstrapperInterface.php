<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Contracts;

use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\ServiceProvider\Support\BootstrapperRunner;

/**
 * Contract every app-boot bootstrapper honors.
 *
 * ## What this contract owns
 *
 * A Bootstrapper is the single seam through which a module hydrates
 * a domain registry (personas, tools, retention policies, permissions,
 * settings, health checks, cache-tag resolvers, seeders, …) at app
 * boot time. Runs ONCE per framework boot; per-request code touches
 * the pre-populated registry rather than a scanner. See ADR 0020 for
 * the anti-conflation contract with `TenancyHookInterface` — the
 * per-tenant sibling lifecycle.
 *
 * ## Cache contract
 *
 * Cacheable bootstrappers (the default — see {@see isCacheable()})
 * hand a serializable payload to the framework cache under
 * {@see cacheKey()}. Subsequent boots skip {@see populate()} when
 * `AbstractBootstrapper::fromCachePayload()` returns `true` for the
 * cached payload — the source of truth for that logic lives on
 * {@see AbstractBootstrapper}.
 *
 * ## Contract vs. base class
 *
 * The contract enumerates the six lifecycle questions the runner asks;
 * the abstract base implements sensible defaults for four of them so
 * subclasses only override what they need. Never implement this
 * interface directly on a concrete class — always extend
 * {@see AbstractBootstrapper}.
 *
 * @see AbstractBootstrapper The base class every bootstrapper extends.
 * @see BootstrapperRunner         Iterates the registry and drives the lifecycle.
 * @see TenancyHookInterface     Per-tenant sibling lifecycle (ADR 0020).
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
interface BootstrapperInterface
{
    /**
     * Machine-readable identifier used for logging + cache slot derivation.
     *
     * Convention: dot-separated `<module>.<concern>` in kebab-case
     * (e.g. `ai.personas`, `ai.tools`, `compliance.retention-policies`,
     * `access.permissions`). The runner logs this on every bootstrapper
     * invocation so ops can attribute duration + hit/miss stats.
     *
     * @return string Stable identifier; MUST NOT change across releases.
     */
    public function name(): string;

    /**
     * Execution priority — lower values run first.
     *
     * See `.kiro/steering/bootstrappers.md` for the canonical ranges:
     *   * -1000..-1 meta-bootstrappers (framework's own discovery bootstrapper)
     *   * 0..99     framework primitives
     *   * 100..199  domain modules
     *   * 200..999  consumer overlays
     *   * 1000+     diagnostics
     *
     * Ties break by FQCN (alphabetical) so ordering is stable across runs.
     *
     * @return int Priority value; SMALLER numbers run EARLIER.
     */
    public function priority(): int;

    /**
     * Perform the discovery + registry hydration.
     *
     * Invoked exactly once per boot when the cache lookup fails
     * (either the slot is empty or `fromCachePayload()` returned
     * `false`). Errors thrown here are logged + swallowed by the
     * runner — a broken bootstrapper must not halt boot.
     */
    public function populate(): void;

    /**
     * Whether this bootstrapper's output is safely serializable
     * across boots.
     *
     * Return `false` for bootstrappers whose {@see populate()} touches
     * per-boot-varying state (external services, database rows,
     * container-bound objects with closures) or whose registry is
     * trivially cheap to rebuild. Return `true` (the default) when
     * the discovery cost is worth caching.
     *
     * @return bool `true` to participate in the `bootstrapper.*` cache; `false` to always run `populate()`.
     */
    public function isCacheable(): bool;

    /**
     * Framework-cache slot for the cacheable payload.
     *
     * Base implementation returns `'bootstrapper.' . name()` sanitised
     * to a filesystem-safe key. Subclasses that stash multiple sub-caches
     * MAY override to append a suffix but MUST keep the `bootstrapper.`
     * prefix so `bootstrap:clear` can wipe them.
     *
     * @return string Cache slot; MUST start with the `bootstrapper.` prefix.
     */
    public function cacheKey(): string;

    /**
     * Optional per-slot cache TTL in seconds.
     *
     * `null` means "cache forever until explicit invalidation" via
     * `bootstrap:clear` / `cache:clear` / composer autoload dump. Real
     * TTLs suit bootstrappers whose registry state genuinely varies over
     * days (weekly rotating credentials, tenanted directory metadata).
     *
     * @return int|null Positive TTL in seconds, or `null` for forever.
     */
    public function cacheTtl(): ?int;
}
