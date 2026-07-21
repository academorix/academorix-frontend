<?php

declare(strict_types=1);

namespace Stackra\Geography\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Geography\Contracts\Services\GeolocateServiceInterface;
use Throwable;

/**
 * `php artisan geography:geolocate {ip}` — resolve one IP + print
 * the localized GeolocationData.
 *
 * Useful for debugging MaxMind vs ip-api.com discrepancies without
 * spinning up an HTTP client.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:geolocate',
    description: 'Resolve one IP + print the resolved geolocation.',
)]
final class GeographyGeolocateCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:geolocate
        {ip : IPv4 or IPv6 address to resolve}
        {--locale=en : Locale for country-name resolution}';

    public function handle(GeolocateServiceInterface $geolocate): int
    {
        $this->omni->titleBar('Geolocate', 'sky');

        $ip     = (string) $this->argument('ip');
        $locale = (string) $this->option('locale');

        try {
            $result = $geolocate->resolve($ip, $locale);
        } catch (Throwable $e) {
            $this->omni->error(\sprintf('Geolocate failed: %s', $e->getMessage()));
            $this->showDuration();

            return self::FAILURE;
        }

        if ($result === null) {
            $this->omni->warning(\sprintf('No source resolved IP "%s".', $ip));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Field', 'Value');
        $this->omni->tableRow('ip', $result->ip);
        $this->omni->tableRow('country_code', (string) ($result->countryCode ?? '-'));
        $this->omni->tableRow('country_name', (string) ($result->countryName ?? '-'));
        $this->omni->tableRow('state_code', (string) ($result->stateCode ?? '-'));
        $this->omni->tableRow('state_name', (string) ($result->stateName ?? '-'));
        $this->omni->tableRow('city_name', (string) ($result->cityName ?? '-'));
        $this->omni->tableRow('timezone', (string) ($result->timezone ?? '-'));
        $this->omni->tableRow('source', $result->source);

        $this->omni->success('Resolved.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
