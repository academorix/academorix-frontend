<?php

declare(strict_types=1);

namespace Stackra\Caching\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan cache:build` — warm the production caches.
 *
 * Runs `config:cache`, `route:cache`, and `event:cache` in
 * sequence. Deploy pipelines hit this once at the end of a
 * successful deployment; the compiled artifacts land in
 * `bootstrap/cache/` and every subsequent Octane worker cold-boot
 * reads from them instead of re-parsing config / route files at
 * boot.
 *
 * ## Consumers
 *
 * - The API app's composer alias `cache:warm` calls
 *   `doppler run -- php artisan cache:build`.
 * - `docker/entrypoint.sh` runs this after `php artisan migrate
 *   --force` on production containers.
 *
 * ## What is NOT built here
 *
 * - **`view:cache`** — Blade compilation is lazy per template. Not
 *   worth pre-computing.
 * - **`optimize`** — the umbrella command Laravel documents. Our
 *   discipline is to compose the explicit sub-commands so the
 *   operator SEES what's being cached.
 * - **App cache seeding** — application-cache warm passes are
 *   domain-specific and belong in per-package commands (e.g.
 *   `feature-flags:cache:warm`, `scope:cache:warm`).
 *
 * @category Caching
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'cache:build',
    description: 'Warm production caches: config, route, event.',
)]
final class BuildCacheCommand extends BaseCommand
{
    /**
     * Cache surfaces built in order. Config first because route +
     * event compilers read config at boot; a stale config cache
     * would poison the subsequent builds.
     *
     * @var list<string>
     */
    private const array SURFACES = [
        'config:cache',
        'route:cache',
        'event:cache',
    ];

    /**
     * Execute the warm sweep.
     *
     * Each surface runs via `callSilently()`; any non-zero exit
     * halts the sweep — a bad config cache MUST NOT ship because
     * the subsequent route/event caches would compile against a
     * corrupt config.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Warming production caches', 'sky');

        foreach (self::SURFACES as $surface) {
            $exit = $this->callSilently($surface);

            if ($exit !== self::SUCCESS) {
                $this->omni->error(
                    \sprintf('cache:build halted — `%s` exited %d.', $surface, $exit),
                );
                $this->showDuration();

                return self::FAILURE;
            }

            $this->omni->info(\sprintf('✔ %s', $surface));
        }

        $this->omni->success('Config + route + event caches warmed.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
