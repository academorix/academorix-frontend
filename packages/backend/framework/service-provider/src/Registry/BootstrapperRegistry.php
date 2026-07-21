<?php

declare(strict_types=1);

namespace Stackra\ServiceProvider\Registry;

use Stackra\ServiceProvider\Attributes\AsBootstrapper;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Stackra\ServiceProvider\Contracts\BootstrapperInterface;
use Stackra\ServiceProvider\Support\BootstrapperRunner;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;
use ReflectionClass;
use Throwable;

/**
 * Ordered catalogue of every registered bootstrapper class-string.
 *
 * ## What this class owns
 *
 *  * The `class-string<BootstrapperInterface> → priority` map that
 *    the {@see BootstrapperRunner} iterates at boot — inherited
 *    from {@see AbstractRegistry} which owns the pure-array
 *    storage, the memoized sort, and the insertion-order stable
 *    tie-breaker.
 *  * The bespoke priority-resolution fallback used when a caller
 *    invokes {@see register()} with a `null` priority — reads
 *    `#[AsBootstrapper]` off the class OR asks the container for
 *    a transient instance to call {@see BootstrapperInterface::priority()}.
 *    See {@see resolvePriorityFor()} for the resolution chain.
 *
 * ## Why extend `AbstractRegistry`
 *
 * The mechanical shape (priority map, insertion-cursor
 * tie-breaker, memoized sort, `has()`, `count()`, `clear()`,
 * metadata, entries, priority/metadata accessors) is shared with
 * every other registry in the monorepo. Concentrating it on the
 * base keeps the perf-critical Octane-safe pattern in ONE place
 * and lets this subclass focus on the bootstrapper-specific
 * fallback semantics.
 *
 * ## Why `#[Singleton]`
 *
 * The registry is a boot-time catalogue of class-strings — no
 * per-request state, safe to share across every request in an
 * Octane worker. See `.kiro/steering/octane-first-di.md` for the
 * rule.
 *
 * ## Concept split — see ADR 0020
 *
 * This registry holds **app-boot** bootstrapper classes cached
 * under `bootstrapper.*`. Its sibling
 * {@see TenancyHookRegistry}
 * holds **per-tenant** lifecycle classes that never touch the
 * cache. Two concepts, two registries — ADR 0020 documents the
 * anti-conflation rules.
 *
 * @see BootstrapperInterface Contract every registered class honors.
 * @see BootstrapperRunner    Iterates this registry at boot.
 * @see AsBootstrapper        Attribute-based registration path.
 * @see AbstractRegistry      Shared base — pure arrays + memoized sort.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Singleton]
final class BootstrapperRegistry extends AbstractRegistry
{
    /**
     * @param  Container  $container  Container used to resolve a
     *                                bootstrapper's declared priority
     *                                when the caller doesn't supply
     *                                one explicitly.
     */
    public function __construct(
        private readonly Container $container,
    ) {}

    /**
     * Register a bootstrapper class-string.
     *
     * Duplicate registration is idempotent (delegates to the base
     * class after resolving the priority). Priority resolution:
     * caller-supplied value wins; when `null`, the
     * `#[AsBootstrapper]` attribute on the class is consulted;
     * when that's also absent, the class's own
     * {@see BootstrapperInterface::priority()} method is asked via
     * a transient container resolution.
     *
     * The nullable `?int $priority` signature preserves the
     * back-compat with existing callers (the discovery
     * bootstrapper + the provider trait) who leave the priority
     * unresolved and lean on the class-string derivation. Passing
     * an explicit `int` short-circuits the derivation entirely.
     *
     * @param  string  $key
     *                       Fully-qualified class-string of a class extending
     *                       {@see AbstractBootstrapper}.
     * @param  int|null  $priority
     *                              Explicit priority override, or `null` to derive
     *                              from the class. See {@see resolvePriorityFor()}
     *                              for the fallback chain.
     * @param  mixed  $metadata
     *                           Optional arbitrary payload — bootstrapper
     *                           registrations rarely carry metadata; the
     *                           parameter exists to satisfy the base's
     *                           signature. Pass `null` (default) unless a
     *                           caller has a specific record to attach.
     */
    public function register(string $key, ?int $priority = null, mixed $metadata = null): void
    {
        $resolved = $priority ?? $this->resolvePriorityFor($key, AbstractBootstrapper::DEFAULT_PRIORITY);

        parent::register($key, $resolved, $metadata);
    }

    /**
     * Derive the priority of `$bootstrapperClass` from either the
     * `#[AsBootstrapper]` attribute (if present) or a transient
     * container instance (fallback).
     *
     * Overrides the base pass-through so the derivation runs even
     * when the caller left {@see register()}'s `$priority`
     * argument at `null` — a common shape for discovery-based
     * registration where the class-string is the only input.
     *
     * Errors during resolution — missing class, non-instantiable
     * abstract, container failure — fall back to
     * `$providedPriority` (which the caller-facing wrapper
     * defaults to {@see AbstractBootstrapper::DEFAULT_PRIORITY})
     * so a single misconfigured bootstrapper never halts
     * registration.
     *
     * @param  string  $key
     *                       Fully-qualified class-string extending
     *                       {@see AbstractBootstrapper}.
     * @param  int  $providedPriority
     *                                 Priority argument the caller supplied — the
     *                                 fallback when attribute + container
     *                                 introspection both fail.
     * @return int Resolved priority — lower runs earlier.
     */
    protected function resolvePriorityFor(string $key, int $providedPriority): int
    {
        try {
            $reflection = new ReflectionClass($key);

            foreach ($reflection->getAttributes(AsBootstrapper::class) as $attribute) {
                /** @var AsBootstrapper $instance */
                $instance = $attribute->newInstance();

                return $instance->priority;
            }

            /** @var BootstrapperInterface $sample */
            $sample = $this->container->make($key);

            return $sample->priority();
        } catch (Throwable) {
            return $providedPriority;
        }
    }
}
