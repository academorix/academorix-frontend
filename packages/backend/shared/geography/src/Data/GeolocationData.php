<?php

declare(strict_types=1);

namespace Stackra\Geography\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for the `/geolocate` endpoint.
 *
 * The `ip` echoed back is the same one the caller submitted — the
 * geolocate service caches per `(ip, locale)` for 1h but never joins
 * IP against `tenant_id` or `user_id` on the durable audit trail.
 *
 * Latitude / longitude are coarse (city-level, ~1km accuracy). We do
 * not surface street-level coordinates from any source.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class GeolocationData extends Data
{
    /**
     * @param  string       $ip              The IP the caller submitted.
     * @param  string|null  $countryCode     ISO-3166 alpha-2.
     * @param  string|null  $countryName     Locale-aware country display name.
     * @param  string|null  $stateCode       ISO-3166-2 sub-code.
     * @param  string|null  $stateName       English state name.
     * @param  string|null  $cityName        English city name.
     * @param  string|null  $postalCode      Postal / ZIP code when known.
     * @param  float|null   $latitude        City-level latitude.
     * @param  float|null   $longitude       City-level longitude.
     * @param  string|null  $timezone        IANA timezone name.
     * @param  int|null     $accuracyRadius  Radius in km (MaxMind-provided).
     * @param  string       $source          Deciding source — see {@see \Stackra\Geography\Enums\GeolocationSource}.
     */
    public function __construct(
        public string $ip,
        public ?string $countryCode = null,
        public ?string $countryName = null,
        public ?string $stateCode = null,
        public ?string $stateName = null,
        public ?string $cityName = null,
        public ?string $postalCode = null,
        public ?float $latitude = null,
        public ?float $longitude = null,
        public ?string $timezone = null,
        public ?int $accuracyRadius = null,
        public string $source = 'maxmind',
    ) {
    }
}
