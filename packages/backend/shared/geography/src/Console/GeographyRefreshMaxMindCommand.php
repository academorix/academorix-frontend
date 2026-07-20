<?php

declare(strict_types=1);

namespace Academorix\Geography\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Geography\Contracts\Services\GeolocateServiceInterface;
use Throwable;

/**
 * `php artisan geography:refresh-maxmind` — dispatch a synchronous
 * MaxMind GeoLite2 refresh.
 *
 * Bypasses the freshness check when `--force` is passed.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:refresh-maxmind',
    description: 'Refresh the local GeoLite2-City database from MaxMind.',
)]
final class GeographyRefreshMaxMindCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:refresh-maxmind
        {--force : Bypass the freshness check + always re-download}';

    public function handle(GeolocateServiceInterface $geolocate): int
    {
        $this->omni->titleBar('Refresh MaxMind GeoLite2', 'sky');

        try {
            $geolocate->refreshMaxMindDatabase();
            $this->omni->success('MaxMind refresh complete.');
            $this->showDuration();

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->omni->error('MaxMind refresh failed: ' . $e->getMessage());
            $this->showDuration();

            return self::FAILURE;
        }
    }
}
