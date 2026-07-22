<?php

declare(strict_types=1);

namespace Stackra\Caching\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan cache:flush` — clear every Laravel cache namespace.
 *
 * Fires the standard clear command for each cache surface — config,
 * route, view, event, schedule, application cache, and the
 * consolidated `optimize:clear`. Per-namespace failures are logged
 * but never abort the sweep — a missing view compiler shouldn't
 * stop a config-cache clear.
 *
 * ## Consumers
 *
 * - The API app's composer alias `cache:clear` calls
 *   `doppler run -- php artisan cache:flush` — one target,
 *   consistent output.
 * - Deploy scripts hit this once at start-of-deploy before
 *   `cache:build` warms production caches.
 * - The `stackra/console` scheduler's post-boot hook clears
 *   route caches when discovery finds new routes.
 *
 * ## Why not the built-in `cache:clear`?
 *
 * Laravel's `cache:clear` alone clears ONLY the application cache
 * store — it does not touch config / route / view / event caches.
 * Ops asks "why is my new route 404?" and the answer is "you need
 * to `route:clear` too". This command answers the ambient
 * expectation of "clear every cache" in one call.
 *
 * @category Caching
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'cache:flush',
    description: 'Clear every Laravel cache namespace (config, route, view, event, schedule, application, optimize).',
)]
final class FlushCacheCommand extends BaseCommand
{
    /**
     * Namespaces cleared in order. Each is best-effort: a missing
     * namespace (e.g. `schedule:clear-cache` when the scheduler
     * package isn't installed) logs a warning and continues.
     *
     * `optimize:clear` runs last on purpose — it clears the
     * bootstrap/cache/*.php files that Laravel writes when
     * `optimize` runs. Running it earlier would be re-populated by
     * the intervening clear commands' own boot sequence.
     *
     * @var list<string>
     */
    private const array NAMESPACES = [
        'config:clear',
        'route:clear',
        'view:clear',
        'event:clear',
        'schedule:clear-cache',
        'cache:clear',
        'optimize:clear',
    ];

    /**
     * Execute the sweep.
     *
     * Iterates {@see NAMESPACES} and calls each artisan command via
     * {@see \Illuminate\Console\Command::callSilently()}. Any
     * non-zero exit is surfaced in the summary table but does NOT
     * halt the sweep — every namespace gets a chance to clear.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Flushing every Laravel cache', 'sky');

        $this->omni->tableHeader('Namespace', 'Result');
        $failures = 0;

        foreach (self::NAMESPACES as $namespace) {
            $exit = $this->callSilently($namespace);

            if ($exit === self::SUCCESS) {
                $this->omni->tableRowSuccess($namespace, 'cleared');

                continue;
            }

            $failures++;
            $this->omni->tableRowWarning(
                $namespace,
                'exit ' . $exit,
                'namespace missing or provider not booted',
            );
        }

        if ($failures === 0) {
            $this->omni->success('All caches cleared.');
        } else {
            $this->omni->warning(
                \sprintf(
                    '%d of %d namespaces skipped (warnings only) — see table above.',
                    $failures,
                    \count(self::NAMESPACES),
                ),
            );
        }

        $this->showDuration();

        return self::SUCCESS;
    }
}
