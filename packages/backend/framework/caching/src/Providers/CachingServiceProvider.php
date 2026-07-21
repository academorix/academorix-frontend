<?php

/**
 * @file packages/framework/caching/src/Providers/CachingServiceProvider.php
 *
 * @description
 * Root service provider for `stackra/caching`. Wires:
 *
 *   1. The `caching.*` config namespace (merges the shipped
 *      default into the app's config bag; publishable under the
 *      `caching-config` tag for env-specific overrides).
 *
 *   2. The {@see \Stackra\Caching\Support\CacheKeyBuilder}
 *      singleton, seeded with `caching.tag_prefix`.
 *
 *   3. The {@see \Stackra\Caching\Support\TaggableCacheGuard}
 *      singleton, seeded with `caching.fail_open_untagged`.
 *
 *   4. The {@see \Stackra\Caching\Registry\CacheTagResolverRegistry}
 *      singleton, hydrated by the boot-time discovery pass.
 *
 *   5. The {@see \Stackra\Caching\Support\CacheTagBuilder}
 *      singleton, injected with the registry + tag prefix.
 *
 *   6. The boot-time discovery pass that reads every
 *      `#[AsCacheTagResolver]` class from
 *      `olvlvl/composer-attribute-collector`, filters by the
 *      `enabled` flag, resolves each out of the container, and
 *      appends to the registry (respecting priority ordering).
 *
 * ## Attribute-first
 *
 * The provider is deliberately thin. Every extension point is
 * discovered via an attribute — the shipped
 * {@see \Stackra\Caching\Resolvers\NullCacheTagResolver} is
 * discovered exactly like any consumer resolver via its own
 * `#[AsCacheTagResolver]`. There's no special-cased branch for
 * package-owned defaults.
 *
 * ## Octane safety
 *
 * Every binding is either `singleton` (immutable state, safe to
 * share across requests) or `scoped` (per-request). No closure
 * captures mutable state; no facades are read inside container
 * bindings that persist beyond a single request lifecycle.
 *
 * @see \Stackra\Caching\Attributes\AsCacheTagResolver Discovery marker.
 * @see \Stackra\Caching\Registry\CacheTagResolverRegistry Discovery target.
 */

declare(strict_types=1);

namespace Stackra\Caching\Providers;

use Stackra\Caching\Attributes\AsCacheTagResolver;
use Stackra\Caching\Contracts\CacheTagResolver;
use Stackra\Caching\Registry\CacheTagResolverRegistry;
use Stackra\Caching\Support\CacheKeyBuilder;
use Stackra\Caching\Support\CacheTagBuilder;
use Stackra\Caching\Support\TaggableCacheGuard;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

/**
 * Root provider for the caching package.
 */
#[AsModule(name: 'Caching', priority: 100)]
#[LoadsResources()]
final class CachingServiceProvider extends ServiceProvider
{
    /**
     * Merge default config + register every container binding.
     *
     * All bindings are singletons because their internal state
     * is either immutable (readonly classes) or the memoised
     * output of a boot-time discovery pass. Under Octane one
     * instance serves every worker request; discovery cost is
     * paid once per worker lifetime.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/caching.php',
            'caching',
        );

        $this->app->singleton(CacheKeyBuilder::class, static function (Application $app): CacheKeyBuilder {
            /** @var string $prefix */
            $prefix = $app->make('config')->get('caching.tag_prefix', '');
            return new CacheKeyBuilder($prefix);
        });

        $this->app->singleton(TaggableCacheGuard::class, static function (Application $app): TaggableCacheGuard {
            /** @var bool $failOpen */
            $failOpen = (bool) $app->make('config')->get('caching.fail_open_untagged', true);
            return new TaggableCacheGuard($failOpen);
        });

        $this->app->singleton(CacheTagResolverRegistry::class, static fn (): CacheTagResolverRegistry
            => new CacheTagResolverRegistry(),
        );

        $this->app->singleton(CacheTagBuilder::class, static function (Application $app): CacheTagBuilder {
            /** @var CacheTagResolverRegistry $registry */
            $registry = $app->make(CacheTagResolverRegistry::class);
            /** @var string $prefix */
            $prefix   = $app->make('config')->get('caching.tag_prefix', '');
            return new CacheTagBuilder($registry, $prefix);
        });
    }

    /**
     * Publish the config file + run resolver discovery.
     *
     * Discovery walks `olvlvl/composer-attribute-collector` for
     * every class carrying `#[AsCacheTagResolver]`, filters by
     * the `enabled` flag, resolves each out of the container,
     * and appends to the registry (respecting priority order).
     */
    public function boot(): void
    {
        $this->publishes(
            [__DIR__ . '/../../config/caching.php' => $this->app->configPath('caching.php')],
            'caching-config',
        );

        $this->discoverResolvers();
    }

    /**
     * Walk `olvlvl/composer-attribute-collector` for
     * `#[AsCacheTagResolver]` targets and hydrate the registry.
     *
     * When the collector index is missing (fresh install before
     * `composer dump-autoload`) or the class isn't loadable,
     * the pass is a no-op — the registry stays empty and the
     * tag builder emits only base segments.
     */
    private function discoverResolvers(): void
    {
        // The collector class is emitted by `olvlvl/composer-attribute-collector`
        // at composer-dump time. It only exists when at least one
        // attribute in the app has been indexed — reference by
        // string so the caching package can load without the
        // collector present in packaged tests.
        $collectorClass = '\\Composer\\Attribute\\Collection';
        if (! class_exists($collectorClass)) {
            return;
        }

        /** @var CacheTagResolverRegistry $registry */
        $registry   = $this->app->make(CacheTagResolverRegistry::class);
        $priorities = [];

        /**
         * @var iterable<object{ name: class-string, attribute: AsCacheTagResolver }> $targets
         * The collector's `findTargetClasses()` returns TargetClass
         * value objects — indexed for O(1) lookup at boot.
         */
        $targets = $collectorClass::findTargetClasses(AsCacheTagResolver::class);

        foreach ($targets as $target) {
            $attribute = $target->attribute;
            if (! $attribute->enabled) {
                continue;
            }

            $class = $target->name;
            if (! is_subclass_of($class, CacheTagResolver::class)) {
                // Silently skip mis-tagged classes — the
                // architecture rule catches this at PHPStan time.
                continue;
            }

            /** @var CacheTagResolver $resolver */
            $resolver = $this->app->make($class);
            $priorities[$class] = $attribute->priority;

            $registry->add($resolver);
        }

        $registry->sortByPriority($priorities);
    }
}
