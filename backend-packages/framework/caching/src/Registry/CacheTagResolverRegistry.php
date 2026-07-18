<?php

/**
 * @file packages/framework/caching/src/Registry/CacheTagResolverRegistry.php
 *
 * @description
 * Boot-time discovery result. Holds the sorted, deduplicated
 * chain of every registered
 * {@see \Academorix\Caching\Contracts\CacheTagResolver} — the
 * {@see \Academorix\Caching\Support\CacheTagBuilder} consumes
 * this registry when composing tags.
 *
 * ## Lifecycle
 *
 * The `CachingServiceProvider` walks
 * `Composer\Attribute\Collection::findTargetClasses(AsCacheTagResolver::class)`
 * during its `#[OnBoot]` phase, filters the classes by the
 * `enabled` flag, resolves each out of the container, sorts by
 * `priority` (lower first, ties broken by class-name), and hands
 * the final list to this registry.
 *
 * Under Octane the registry is bound as a `#[Singleton]` — one
 * shared list serves every worker request; the discovery cost is
 * paid once at boot.
 *
 * ## Why a dedicated class
 *
 * The tag builder could accept a `list<CacheTagResolver>`
 * directly, but pulling the collection into a named registry
 * gives us:
 *
 *   - A stable seam for diagnostics (`->count()`, `->named()`).
 *   - A place to memoise a filtered view (e.g. "resolvers
 *     enabled for tenant X") without leaking that logic into
 *     the builder.
 *   - A single point to swap for a `NullRegistry` in tests
 *     without instantiating every resolver in the app.
 *
 * @see \Academorix\Caching\Attributes\AsCacheTagResolver Discovery marker.
 * @see \Academorix\Caching\Support\CacheTagBuilder Consumer.
 */

declare(strict_types=1);

namespace Academorix\Caching\Registry;

use Academorix\Caching\Contracts\CacheTagResolver;

/**
 * Sorted resolver chain populated at boot.
 */
final class CacheTagResolverRegistry
{
    /**
     * The active resolver chain — ordered by priority (lower
     * first). Duplicates by class name are removed at
     * registration time so callers never see the same resolver
     * twice.
     *
     * @var list<CacheTagResolver>
     */
    private array $resolvers = [];

    /**
     * @param  list<CacheTagResolver>  $initial  Optional starting chain — usually left empty; the service provider hydrates via `add()`.
     */
    public function __construct(array $initial = [])
    {
        foreach ($initial as $resolver) {
            $this->add($resolver);
        }
    }

    /**
     * Append a resolver. Duplicates (by class name) are skipped.
     *
     * The registry does not sort on `add()` — sorting happens
     * once at boot via {@see sortByPriority()} to keep the
     * runtime cost of registration linear.
     */
    public function add(CacheTagResolver $resolver): void
    {
        foreach ($this->resolvers as $existing) {
            if ($existing::class === $resolver::class) {
                return;
            }
        }

        $this->resolvers[] = $resolver;
    }

    /**
     * Sort the chain by the provided priority map. Called once
     * during the boot hook after every resolver has been added.
     *
     * @param  array<class-string, int>  $priorities  Class-string → priority. Missing entries default to 100.
     */
    public function sortByPriority(array $priorities): void
    {
        usort($this->resolvers, static function (CacheTagResolver $a, CacheTagResolver $b) use ($priorities): int {
            $priorityA = $priorities[$a::class] ?? 100;
            $priorityB = $priorities[$b::class] ?? 100;

            return $priorityA === $priorityB
                ? strcmp($a::class, $b::class)
                : $priorityA <=> $priorityB;
        });
    }

    /**
     * The active chain, in the priority order fixed at boot.
     *
     * @return list<CacheTagResolver>
     */
    public function all(): array
    {
        return $this->resolvers;
    }

    /**
     * Total resolver count — used by diagnostic tooling.
     */
    public function count(): int
    {
        return count($this->resolvers);
    }

    /**
     * Look up a resolver by class name. Returns `null` when the
     * resolver is not registered (e.g. disabled at boot).
     *
     * @param  class-string<CacheTagResolver>  $class
     */
    public function named(string $class): ?CacheTagResolver
    {
        foreach ($this->resolvers as $resolver) {
            if ($resolver::class === $class) {
                return $resolver;
            }
        }

        return null;
    }
}
