<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Services;

use Academorix\Geography\Data\GeolocationData;
use Academorix\Geography\Services\MaxMindGeolocateService;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolve an IP address to a coarse-grained geolocation.
 *
 * Bound to {@see MaxMindGeolocateService} by default — a service that
 * wraps the vendor's local GeoLite2 database with an ip-api.com
 * fallback and a per-`(ip, locale)` Redis cache. Consumer apps
 * override the binding to a stub in tests.
 *
 * ## Contract
 *
 *  - {@see resolve()} — returns a `GeolocationData` on success,
 *    `null` when neither MaxMind nor ip-api.com could resolve the IP.
 *    Fires `GeolocationResolved` on success, `GeolocationFailed` on
 *    a total miss.
 *  - {@see refreshMaxMindDatabase()} — download / refresh the local
 *    GeoLite2-City database via the vendor's console command. Fires
 *    `MaxMindDatabaseRefreshed` on success, dispatches
 *    `MaxMindRefreshFailedNotification` on failure.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(MaxMindGeolocateService::class)]
interface GeolocateServiceInterface
{
    /**
     * Resolve `$ip` to a coarse-grained location.
     *
     * @param  string       $ip      IPv4 / IPv6 address.
     * @param  string|null  $locale  BCP-47 locale for country-name
     *                               translation. Defaults to
     *                               `config('geography.geolocate.default_locale')`.
     * @return GeolocationData|null  The resolved location, or `null`
     *                               when both sources fail.
     *
     * @throws \Academorix\Geography\Exceptions\GeographyGeolocateInvalidIpException
     * @throws \Academorix\Geography\Exceptions\GeographyGeolocatePrivateIpException
     */
    public function resolve(string $ip, ?string $locale = null): ?GeolocationData;

    /**
     * Refresh the local GeoLite2-City database via
     * `Nnjeim\World\Console\Commands\GeoipCommand`.
     *
     * @throws \Academorix\Geography\Exceptions\GeographyMaxMindMissingException
     */
    public function refreshMaxMindDatabase(): void;
}
