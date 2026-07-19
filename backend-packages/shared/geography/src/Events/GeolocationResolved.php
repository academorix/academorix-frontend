<?php

declare(strict_types=1);

namespace Academorix\Geography\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when the geolocate service resolves an IP.
 *
 * Consumed by the localization module (optional) for region-default
 * heuristics + by the telemetry module's metrics collector.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class GeolocationResolved
{
    use Dispatchable;

    /**
     * @param  string       $ip           The IP the caller submitted.
     * @param  string|null  $countryCode  ISO-3166 alpha-2.
     * @param  string|null  $stateCode    ISO-3166-2 sub-code.
     * @param  string|null  $cityName     English city name.
     * @param  string|null  $timezone     IANA timezone name.
     * @param  string       $source       Deciding source — `maxmind` / `ip_api` / `cache`.
     * @param  int          $durationMs   Wall-clock duration in ms.
     */
    public function __construct(
        public string $ip,
        public ?string $countryCode,
        public ?string $stateCode,
        public ?string $cityName,
        public ?string $timezone,
        public string $source,
        public int $durationMs,
    ) {
    }
}
