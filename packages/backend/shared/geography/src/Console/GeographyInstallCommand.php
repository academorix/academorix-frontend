<?php

declare(strict_types=1);

namespace Stackra\Geography\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Illuminate\Support\Facades\Artisan;

/**
 * `php artisan geography:install` — convenience wrapper for the
 * vendor `world:install` seeder.
 *
 * Seeds the six reference tables (countries / states / cities /
 * currencies / languages / timezones) with vendor data. Idempotent
 * unless `--force` is passed.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:install',
    description: 'Seed the six reference tables via the vendor world:install command.',
)]
final class GeographyInstallCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:install
        {--force : Truncate + re-seed (destructive)}';

    public function handle(): int
    {
        $this->omni->titleBar('Install Geography Catalog', 'emerald');

        $force = (bool) $this->option('force');

        $args = $force ? ['--force' => true] : [];

        $exit = Artisan::call('world:install', $args, $this->output);

        if ($exit === 0) {
            $this->omni->success('Vendor world:install completed successfully.');
        } else {
            $this->omni->error('Vendor world:install failed with exit code ' . (string) $exit);
        }

        $this->showDuration();

        return $exit === 0 ? self::SUCCESS : self::FAILURE;
    }
}
