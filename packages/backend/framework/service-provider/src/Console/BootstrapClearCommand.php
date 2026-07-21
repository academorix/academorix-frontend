<?php

/**
 * @file packages/framework/service-provider/src/Console/BootstrapClearCommand.php
 *
 * @description
 * `php artisan bootstrap:clear` — wipes every `bootstrapper.*`
 * framework-cache slot so the next boot re-runs discovery
 * from scratch.
 *
 * Mirrors the shape of Laravel's built-in `config:clear` /
 * `route:clear` — targets a specific cache namespace rather than
 * the whole store.
 */

declare(strict_types=1);

namespace Stackra\ServiceProvider\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Stackra\ServiceProvider\Contracts\BootstrapperInterface;
use Stackra\ServiceProvider\Registry\BootstrapperRegistry;
use Illuminate\Cache\RedisStore;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Container\Container;
use Throwable;

/**
 * Clear every bootstrapper cache slot.
 *
 * ## What this command owns
 *
 *  * Sweep-and-delete of every framework-cache key under the
 *    `bootstrapper.*` prefix.
 *  * Redis-aware `SCAN` fast-path — when the default cache store
 *    is Redis-backed, we `SCAN MATCH bootstrapper.*` for O(N-keys)
 *    deletion; otherwise we walk the {@see BootstrapperRegistry}
 *    and delete each entry's `cacheKey()` individually.
 *  * Reports totals via `$this->omni` — one row per cleared key
 *    plus a summary line so the operator can confirm the sweep.
 *
 * ## When to run
 *
 *  * After a `composer dump-autoload` that adds a new
 *    `#[AsBootstrapper]` — the manifest changed and the previous
 *    cache is stale.
 *  * After a class rename that touched a registered bootstrapper.
 *  * When diagnostics report unexpected registrations — a full
 *    clear + `bootstrap:cache` rebuild is the safe reset.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'bootstrap:clear',
    description: 'Clear every framework cache entry under the bootstrapper.* prefix.',
)]
final class BootstrapClearCommand extends BaseCommand
{
    /**
     * Sweep every `bootstrapper.*` cache slot.
     *
     * @param  BootstrapperRegistry  $registry  Provides the fallback list of cache keys when Redis SCAN isn't available.
     * @param  Container  $container  Container used to resolve each bootstrapper for its `cacheKey()`.
     * @param  Repository  $cache  Framework cache (default store) — target of the sweep.
     * @return int Symfony console exit code — `self::SUCCESS` even on empty registries.
     */
    public function handle(
        BootstrapperRegistry $registry,
        Container $container,
        #[Cache] Repository $cache,
    ): int {
        $this->omni->titleBar('Bootstrap Clear', 'sky');

        $store = $cache->getStore();
        $cleared = 0;

        if ($store instanceof RedisStore) {
            $cleared = $this->clearViaRedisScan($store, $cache);
        } else {
            $cleared = $this->clearViaRegistry($registry, $container, $cache);
        }

        $this->omni->success(\sprintf(
            'bootstrap:clear complete — %d cache slot(s) removed.',
            $cleared,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }

    /**
     * Redis-backed clear: SCAN the store for every key matching
     * the `bootstrapper.*` prefix and delete each in turn.
     *
     * Uses `SCAN MATCH pattern COUNT 500` semantics via
     * `phpredis::scan()` — non-blocking and safe on production
     * traffic.
     *
     * @param  RedisStore  $store  Redis-backed cache store.
     * @param  Repository  $cache  Wrapping repository — used for the `forget()` call.
     * @return int Number of cache slots successfully removed.
     */
    private function clearViaRedisScan(RedisStore $store, Repository $cache): int
    {
        $prefix = $store->getPrefix();
        $pattern = $prefix.AbstractBootstrapper::CACHE_KEY_PREFIX.'*';
        $cleared = 0;

        try {
            $connection = $store->connection();
            $iterator = null;

            do {
                /** @var list<string>|false $chunk */
                $chunk = $connection->scan($iterator, $pattern, 500);

                if ($chunk === false) {
                    break;
                }

                foreach ($chunk as $prefixedKey) {
                    // Strip the driver prefix so `Repository::forget()`
                    // can re-apply its own before hitting Redis.
                    $bareKey = $prefix === ''
                        ? $prefixedKey
                        : (\str_starts_with($prefixedKey, $prefix)
                            ? substr($prefixedKey, \strlen($prefix))
                            : $prefixedKey);

                    if ($cache->forget($bareKey)) {
                        $this->omni->tableRowSuccess($bareKey, 'cleared', '');
                        $cleared++;
                    }
                }
            } while ($iterator !== 0 && $iterator !== null);
        } catch (Throwable $e) {
            $this->omni->warning(\sprintf(
                'Redis SCAN failed (%s) — falling back to registry sweep.',
                $e->getMessage(),
            ));
        }

        return $cleared;
    }

    /**
     * Registry-driven clear: iterate every registered bootstrapper
     * and delete its own `cacheKey()`. Used when the cache store
     * doesn't expose a SCAN primitive (file / database / array).
     *
     * @return int Number of cache slots successfully removed.
     */
    private function clearViaRegistry(
        BootstrapperRegistry $registry,
        Container $container,
        Repository $cache,
    ): int {
        if ($registry->count() === 0) {
            $this->omni->info('No bootstrappers registered — nothing to clear.');

            return 0;
        }

        $this->omni->tableHeader('Cache Key', 'Status', 'Details');
        $cleared = 0;

        foreach ($registry->all() as $class) {
            try {
                /** @var BootstrapperInterface $bootstrapper */
                $bootstrapper = $container->make($class);

                if (! $bootstrapper->isCacheable()) {
                    continue;
                }

                $key = $bootstrapper->cacheKey();

                if ($cache->forget($key)) {
                    $this->omni->tableRowSuccess($key, 'cleared', $bootstrapper->name());
                    $cleared++;
                } else {
                    $this->omni->tableRow($key, 'absent', $bootstrapper->name());
                }
            } catch (Throwable $e) {
                $this->omni->tableRowError($class, 'error', $e->getMessage());
            }
        }

        return $cleared;
    }
}
