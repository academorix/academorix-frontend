<?php

/**
 * @file packages/framework/service-provider/src/Console/BootstrapCacheCommand.php
 *
 * @description
 * `php artisan bootstrap:cache` — iterate every registered
 * bootstrapper, run its `populate()`, and persist the resulting
 * `toCachePayload()` to the framework cache so the next boot pays
 * zero discovery cost.
 *
 * Mirrors the shape of Laravel's built-in `config:cache` /
 * `route:cache` — a warmer whose write side is idempotent and
 * whose read side is the runtime `BootstrapperRunner`.
 */

declare(strict_types=1);

namespace Academorix\ServiceProvider\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\ServiceProvider\Contracts\BootstrapperInterface;
use Academorix\ServiceProvider\Registry\BootstrapperRegistry;
use Academorix\ServiceProvider\Support\BootstrapperRunner;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Container\Container;
use Throwable;

/**
 * Warm the framework's bootstrapper cache.
 *
 * ## What this command owns
 *
 *  * Iterates every FQCN registered in the shared
 *    {@see BootstrapperRegistry}.
 *  * Resolves each class through the container, runs `populate()`,
 *    then persists `extractCachePayload()` under `cacheKey()` with
 *    `cacheTtl()`.
 *  * Reports totals via `$this->omni` — one row per bootstrapper
 *    plus a summary line so the operator can spot skipped / cached
 *    / errored entries.
 *
 * ## Deploy-hook usage
 *
 * Standard deploy sequence:
 *
 *   1. `composer install --no-dev --optimize-autoloader`
 *   2. `php artisan config:cache`
 *   3. `php artisan bootstrap:cache`
 *   4. `php artisan route:cache`
 *
 * The runtime {@see BootstrapperRunner}
 * consumes the cache written here — every subsequent boot skips
 * the `populate()` pass for cacheable bootstrappers whose
 * `fromCachePayload()` returns `true`.
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'bootstrap:cache',
    description: 'Warm the framework bootstrapper cache by running every registered bootstrapper.',
)]
final class BootstrapCacheCommand extends BaseCommand
{
    /**
     * Populate + persist every bootstrapper's cache payload.
     *
     * @param  BootstrapperRegistry  $registry  Registered bootstrapper class-strings.
     * @param  Container  $container  Container used to resolve each class.
     * @param  Repository  $cache  Framework cache (default store) — persistence sink.
     * @return int Symfony console exit code — `self::SUCCESS` when at least one payload persisted, `self::SUCCESS` on empty registry.
     */
    public function handle(
        BootstrapperRegistry $registry,
        Container $container,
        #[Cache] Repository $cache,
    ): int {
        $this->omni->titleBar('Bootstrap Cache', 'sky');

        if ($registry->count() === 0) {
            $this->omni->info('No bootstrappers registered — nothing to cache.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Bootstrapper', 'Status', 'Details');

        $cached = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($registry->all() as $class) {
            try {
                /** @var BootstrapperInterface $bootstrapper */
                $bootstrapper = $container->make($class);
                $name = $bootstrapper->name();

                if (! $bootstrapper->isCacheable()) {
                    $this->omni->tableRowWarning($name, 'skipped', 'not cacheable');
                    $skipped++;

                    continue;
                }

                $result = $this->omni->task(
                    \sprintf('Populating %s', $name),
                    static function () use ($bootstrapper, $cache): array {
                        $bootstrapper->populate();

                        $payload = $bootstrapper instanceof AbstractBootstrapper
                            ? $bootstrapper->extractCachePayload()
                            : null;

                        if ($payload === null) {
                            return ['state' => 'success', 'message' => 'no payload (skipped write)'];
                        }

                        $ttl = $bootstrapper->cacheTtl();
                        $key = $bootstrapper->cacheKey();

                        if ($ttl === null) {
                            $cache->forever($key, $payload);
                        } else {
                            $cache->put($key, $payload, $ttl);
                        }

                        return [
                            'state' => 'success',
                            'message' => \sprintf('cached at %s', $key),
                        ];
                    },
                );

                if (($result['message'] ?? '') === 'no payload (skipped write)') {
                    $this->omni->tableRow($name, 'skipped', 'null payload');
                    $skipped++;
                } else {
                    $this->omni->tableRowSuccess($name, 'cached', (string) ($result['message'] ?? ''));
                    $cached++;
                }
            } catch (Throwable $e) {
                $this->omni->tableRowError($class, 'error', $e->getMessage());
                $errors++;
            }
        }

        $this->omni->success(\sprintf(
            'bootstrap:cache complete — cached %d, skipped %d, errored %d.',
            $cached,
            $skipped,
            $errors,
        ));
        $this->showDuration();

        return $errors === 0 ? self::SUCCESS : self::FAILURE;
    }
}
