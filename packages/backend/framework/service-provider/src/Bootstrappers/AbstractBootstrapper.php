<?php

declare(strict_types=1);

namespace Academorix\ServiceProvider\Bootstrappers;

use Academorix\ServiceProvider\Attributes\AsBootstrapper;
use Academorix\ServiceProvider\Contracts\BootstrapperInterface;
use Academorix\ServiceProvider\Support\BootstrapperRunner;

/**
 * Base class for every app-boot bootstrapper in the monorepo.
 *
 * ## What this class owns
 *
 *  * Sensible defaults for four of the six {@see BootstrapperInterface}
 *    lifecycle questions — subclasses override only what they need.
 *  * The `cacheKey()` derivation from {@see name()} via
 *    {@see sanitizedName()} — deterministic, filesystem-safe, prefixed
 *    with `bootstrapper.` so `bootstrap:clear` can sweep every slot.
 *  * The `toCachePayload()` / `fromCachePayload()` hook pair the
 *    runner uses to skip {@see populate()} on cache hit. The default
 *    implementations opt every subclass OUT of caching until the
 *    subclass explicitly participates by overriding both methods.
 *
 * ## Lifecycle summary
 *
 *  1. `BootstrapperRunner::run()` resolves the subclass through the
 *     container and asks {@see isCacheable()}.
 *  2. When cacheable, the runner reads the framework cache under
 *     {@see cacheKey()} and hands the payload to
 *     {@see fromCachePayload()}. A `true` return short-circuits the
 *     boot — the subclass rehydrated its registry from cache.
 *  3. Otherwise {@see populate()} runs and, when {@see toCachePayload()}
 *     returns non-null, the payload is written to the cache with
 *     {@see cacheTtl()}.
 *  4. Exceptions in any phase are caught, logged, and the runner
 *     continues with the next bootstrapper (never halts boot).
 *
 * ## Extension checklist
 *
 *  * Provide `name()` (abstract).
 *  * Provide `populate()` (abstract).
 *  * Override `priority()` when the domain slot differs from the
 *    default `100` (framework-primitive < 100, consumer-overlay > 199).
 *  * Override the cache pair {@see toCachePayload()}/{@see fromCachePayload()}
 *    when the registry state serializes cleanly.
 *  * Override {@see isCacheable()} to `false` when the bootstrapper
 *    touches non-serializable state and the cache should never be
 *    consulted.
 *
 * @see BootstrapperInterface The contract this base implements.
 * @see BootstrapperRunner Drives the lifecycle.
 * @see AsBootstrapper Class-level marker for auto-registration.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
abstract class AbstractBootstrapper implements BootstrapperInterface
{
    /**
     * Default priority for bootstrappers that do not override.
     *
     * See `.kiro/steering/bootstrappers.md` for the canonical ranges.
     * `100` sits at the start of the domain-module band so a subclass
     * that forgets to override still runs in a reasonable slot.
     */
    public const int DEFAULT_PRIORITY = 100;

    /**
     * Cache-slot prefix every {@see cacheKey()} MUST carry.
     *
     * `bootstrap:clear` wipes every framework-cache entry starting
     * with this prefix — subclasses that override {@see cacheKey()}
     * keep the prefix intact so the sweep still reaches them.
     */
    public const string CACHE_KEY_PREFIX = 'bootstrapper.';

    /**
     * {@inheritDoc}
     */
    abstract public function name(): string;

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return self::DEFAULT_PRIORITY;
    }

    /**
     * {@inheritDoc}
     */
    abstract public function populate(): void;

    /**
     * {@inheritDoc}
     *
     * Default `true` — the discovery pass is usually expensive enough
     * to warrant caching. Subclasses that touch per-boot-varying
     * state override to `false`.
     */
    public function isCacheable(): bool
    {
        return true;
    }

    /**
     * {@inheritDoc}
     *
     * Deterministic derivation: `bootstrapper.` + a sanitized
     * variant of {@see name()} so `bootstrap:clear` can sweep the
     * whole namespace and diverging drivers (redis vs file) all
     * see the same slot per bootstrapper.
     */
    public function cacheKey(): string
    {
        return self::CACHE_KEY_PREFIX.self::sanitizedName($this->name());
    }

    /**
     * {@inheritDoc}
     *
     * Default `null` — cached forever until explicit invalidation
     * (`bootstrap:clear`, `cache:clear`, or a composer autoload dump
     * that clears the framework cache post-hook).
     */
    public function cacheTtl(): ?int
    {
        return null;
    }

    /**
     * Convert a `name()` string into a filesystem-safe cache
     * segment.
     *
     * Rules — lower-cased ASCII, `[a-z0-9]+` groups joined by `.`,
     * every other character collapsed to `.`. Deterministic +
     * idempotent: calling `sanitizedName(sanitizedName($x))` returns
     * the same value as `sanitizedName($x)`.
     *
     * @param  string  $name  Raw machine name (matches {@see name()}).
     * @return string Sanitized slot segment safe for Redis / file / array drivers.
     */
    protected static function sanitizedName(string $name): string
    {
        $lower = strtolower($name);
        $collapsed = preg_replace('/[^a-z0-9]+/', '.', $lower) ?? '';

        return trim($collapsed, '.');
    }

    /**
     * Optional hook — serialize the registry state produced by
     * {@see populate()} for cache write.
     *
     * Return `null` (the default) to opt this bootstrapper out of
     * caching without touching {@see isCacheable()}. Override to
     * return a serializable dump (array, scalar, DTO) — the runner
     * writes whatever comes back into the framework cache.
     *
     * @return mixed Serializable payload, or `null` to skip cache write.
     */
    protected function toCachePayload(): mixed
    {
        return null;
    }

    /**
     * Optional hook — rehydrate the registry state from a cached
     * payload previously produced by {@see toCachePayload()}.
     *
     * Return `true` to declare the payload was accepted and
     * {@see populate()} should be skipped. Return `false` (the
     * default) to signal a stale / invalid payload — the runner
     * discards the cached payload and falls back to `populate()`.
     *
     * @param  mixed  $payload  The value previously returned by {@see toCachePayload()}.
     * @return bool `true` when handled (skip populate), `false` when the payload is stale.
     */
    protected function fromCachePayload(mixed $payload): bool
    {
        return false;
    }

    /**
     * Runner-facing accessor for {@see toCachePayload()}.
     *
     * The hook is `protected` so subclasses can override without
     * exposing the payload to arbitrary callers. The runner reaches
     * in through this method — the only sanctioned caller.
     *
     * @return mixed Serializable payload, or `null` to skip cache write.
     *
     * @internal Invoked exclusively by {@see BootstrapperRunner}.
     */
    public function extractCachePayload(): mixed
    {
        return $this->toCachePayload();
    }

    /**
     * Runner-facing accessor for {@see fromCachePayload()}.
     *
     * Mirrors {@see extractCachePayload()} — public seam for the
     * runner, protected hook for subclass authoring ergonomics.
     *
     * @param  mixed  $payload  The value previously returned by {@see toCachePayload()}.
     * @return bool `true` when the payload rehydrated the registry, `false` to fall through to `populate()`.
     *
     * @internal Invoked exclusively by {@see BootstrapperRunner}.
     */
    public function hydrateFromCachePayload(mixed $payload): bool
    {
        return $this->fromCachePayload($payload);
    }
}
