<?php

declare(strict_types=1);

namespace Stackra\Geography\Services;

use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Stackra\Geography\Contracts\Services\GeolocateServiceInterface;
use Stackra\Geography\Data\GeolocationData;
use Stackra\Geography\Enums\GeolocationSource;
use Stackra\Geography\Events\GeolocationFailed;
use Stackra\Geography\Events\GeolocationResolved;
use Stackra\Geography\Events\MaxMindDatabaseRefreshed;
use Stackra\Geography\Exceptions\GeographyGeolocateInvalidIpException;
use Stackra\Geography\Exceptions\GeographyGeolocatePrivateIpException;
use Stackra\Geography\Exceptions\GeographyMaxMindMissingException;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Contracts\Container\Container;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Default {@see GeolocateServiceInterface} implementation.
 *
 * Wraps the vendor `nnjeim/world` geolocation contract with a per
 * `(ip, locale)` Redis cache + a MaxMind → ip-api.com fallback chain.
 * Every resolution fires either `GeolocationResolved` (on success)
 * or `GeolocationFailed` (on total miss) so downstream observability
 * can compute source-mix + hit-ratio metrics.
 *
 * `#[Scoped]` — the service holds per-request state (last-source
 * used, per-request timing counters); a fresh instance per request
 * keeps state clean under Octane.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Scoped]
final class MaxMindGeolocateService implements GeolocateServiceInterface
{
    /**
     * @param  CountryRepositoryInterface  $countries      Persistence seam for country lookups
     *                                                     (used to translate ISO codes into
     *                                                     locale-aware names).
     * @param  Repository                  $cache          Redis (or array in tests) cache.
     * @param  LoggerInterface             $log            Package-scoped logger channel.
     * @param  Container                   $container      For lazily resolving the vendor
     *                                                     geolocate service without a hard
     *                                                     compile-time dependency.
     * @param  string                      $preferSource   Preferred first source.
     * @param  string                      $defaultLocale  Fallback locale.
     * @param  int                         $cacheTtl       Cache TTL in seconds.
     */
    public function __construct(
        private readonly CountryRepositoryInterface $countries,
        #[Cache] private readonly Repository $cache,
        #[Log('geography')] private readonly LoggerInterface $log,
        private readonly Container $container,
        #[Config('geography.geolocate.prefer_source', 'maxmind')]
        private readonly string $preferSource = 'maxmind',
        #[Config('geography.geolocate.default_locale', 'en')]
        private readonly string $defaultLocale = 'en',
        #[Config('geography.cache.ttl', 3600)]
        private readonly int $cacheTtl = 3600,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $ip, ?string $locale = null): ?GeolocationData
    {
        $locale ??= $this->defaultLocale;

        // Refuse anything that doesn't parse as a valid IP up-front —
        // the vendor implementations do a partial check but the wire
        // error we want is 422 with `geography.geolocate_invalid_ip`,
        // not a vendor RuntimeException.
        if (\filter_var($ip, FILTER_VALIDATE_IP) === false) {
            throw new GeographyGeolocateInvalidIpException(\sprintf(
                'The submitted value "%s" is not a valid IP address.',
                $ip,
            ));
        }

        // Private / reserved / loopback addresses can't be resolved
        // externally — refuse before the outbound call would fail.
        if (\filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            throw new GeographyGeolocatePrivateIpException(\sprintf(
                'The submitted IP "%s" is private, loopback, or reserved.',
                $ip,
            ));
        }

        $cacheKey = $this->cacheKey($ip, $locale);

        // Cache hit — return the memo'd result and mark the source as
        // `cache` for observability. We still fire the resolved event
        // so downstream metrics see this hit.
        $cached = $this->cache->get($cacheKey);
        if ($cached instanceof GeolocationData) {
            $cached = new GeolocationData(
                ip: $cached->ip,
                countryCode: $cached->countryCode,
                countryName: $cached->countryName,
                stateCode: $cached->stateCode,
                stateName: $cached->stateName,
                cityName: $cached->cityName,
                postalCode: $cached->postalCode,
                latitude: $cached->latitude,
                longitude: $cached->longitude,
                timezone: $cached->timezone,
                accuracyRadius: $cached->accuracyRadius,
                source: GeolocationSource::Cache->value,
            );

            GeolocationResolved::dispatch(
                $ip,
                $cached->countryCode,
                $cached->stateCode,
                $cached->cityName,
                $cached->timezone,
                GeolocationSource::Cache->value,
                0,
            );

            return $cached;
        }

        $started = \microtime(true);

        // Resolution walk — try the preferred source first, then the
        // other. Both wrapper methods are fail-soft and return `null`
        // rather than throwing when the underlying source is silent.
        $result = $this->preferSource === GeolocationSource::MaxMind->value
            ? ($this->resolveViaMaxMind($ip, $locale) ?? $this->resolveViaIpApi($ip, $locale))
            : ($this->resolveViaIpApi($ip, $locale) ?? $this->resolveViaMaxMind($ip, $locale));

        $duration = (int) ((\microtime(true) - $started) * 1000);

        if ($result === null) {
            GeolocationFailed::dispatch(
                $ip,
                'no source resolved the address',
                null,
            );

            return null;
        }

        // Persist the successful resolution in cache. Cache the full
        // DTO shape so subsequent hits can preserve country name +
        // locale-specific data.
        $this->cache->put($cacheKey, $result, $this->cacheTtl);

        GeolocationResolved::dispatch(
            $ip,
            $result->countryCode,
            $result->stateCode,
            $result->cityName,
            $result->timezone,
            $result->source,
            $duration,
        );

        return $result;
    }

    /**
     * {@inheritDoc}
     *
     * Delegates to the vendor's `world:geoip` command. The command
     * expects `MAXMIND_LICENSE_KEY` in the environment — the
     * consumer (`geography:refresh-maxmind` command / the queue job)
     * enforces its presence before calling.
     */
    public function refreshMaxMindDatabase(): void
    {
        $licenseKey = (string) \config('geography.maxmind.license_key', '');
        if ($licenseKey === '') {
            // Refresh cannot proceed without the license key — this
            // is a config problem, not a runtime resolve failure.
            throw new GeographyMaxMindMissingException(
                'MAXMIND_LICENSE_KEY is not set — cannot refresh the GeoLite2 database.',
            );
        }

        $started = \microtime(true);

        // Invoke the vendor command by class name so we don't force a
        // hard compile-time dependency on the vendor's console class.
        try {
            \Illuminate\Support\Facades\Artisan::call('world:geoip');
        } catch (Throwable $e) {
            $this->log->error('geography.maxmind.refresh_failed', [
                'exception' => $e::class,
                'message'   => $e->getMessage(),
            ]);

            throw new GeographyMaxMindMissingException(
                'Vendor geoip refresh command failed: ' . $e->getMessage(),
            );
        }

        $duration = (int) ((\microtime(true) - $started) * 1000);

        $path = (string) \config('geography.maxmind.database_path', 'storage/app/geoip/GeoLite2-City.mmdb');
        $size = \file_exists($path) ? (int) \filesize($path) : 0;

        MaxMindDatabaseRefreshed::dispatch(
            $path,
            $size,
            'unknown',
            $duration,
        );
    }

    /**
     * Resolve via the local MaxMind DB. Returns null when the DB is
     * missing, out of date, or returns no hit — the caller is
     * responsible for cascading to ip-api.com.
     */
    private function resolveViaMaxMind(string $ip, string $locale): ?GeolocationData
    {
        try {
            // Vendor service resolution is lazy: the vendor package
            // may not always bind a concrete class, and we do NOT
            // want a hard compile-time dependency on its symbol name.
            if (! $this->container->bound(\Nnjeim\World\Services\LocateService::class)) {
                return null;
            }

            $service = $this->container->make(\Nnjeim\World\Services\LocateService::class);

            /** @var array<string, mixed>|null $raw */
            $raw = \method_exists($service, 'geolocate') ? $service->geolocate($ip) : null;
            if (! \is_array($raw) || $raw === []) {
                return null;
            }

            return $this->hydrate($ip, $raw, GeolocationSource::MaxMind->value, $locale);
        } catch (Throwable $e) {
            // Fail-soft — the caller chains to ip-api.com. Log at
            // debug level; a total miss on both sources yields a
            // durable `GeolocationFailed` event above.
            $this->log->debug('geography.maxmind.miss', [
                'ip'      => $ip,
                'reason'  => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Resolve via ip-api.com. Free tier is rate-limited (45 req/min
     * per source IP); consumers with heavy geolocate traffic should
     * upgrade to a paid MaxMind subscription rather than rely on
     * this fallback.
     */
    private function resolveViaIpApi(string $ip, string $locale): ?GeolocationData
    {
        try {
            $url = \sprintf(
                'http://ip-api.com/json/%s?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone',
                \rawurlencode($ip),
            );

            $ctx = \stream_context_create([
                'http' => [
                    'method'  => 'GET',
                    'timeout' => 3,
                    'header'  => "Accept: application/json\r\n",
                ],
            ]);

            $body = @\file_get_contents($url, false, $ctx);
            if ($body === false) {
                return null;
            }

            /** @var array<string, mixed>|null $raw */
            $raw = \json_decode($body, true);
            if (! \is_array($raw) || ($raw['status'] ?? null) !== 'success') {
                return null;
            }

            return $this->hydrate($ip, [
                'country_code' => $raw['countryCode'] ?? null,
                'country_name' => $raw['country'] ?? null,
                'state_code'   => $raw['region'] ?? null,
                'state_name'   => $raw['regionName'] ?? null,
                'city_name'    => $raw['city'] ?? null,
                'postal_code'  => $raw['zip'] ?? null,
                'latitude'     => $raw['lat'] ?? null,
                'longitude'    => $raw['lon'] ?? null,
                'timezone'     => $raw['timezone'] ?? null,
            ], GeolocationSource::IpApi->value, $locale);
        } catch (Throwable $e) {
            $this->log->debug('geography.ip_api.miss', [
                'ip'     => $ip,
                'reason' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Hydrate a vendor-shaped array into our typed DTO. Applies
     * locale-aware country-name resolution via the `Country` model's
     * `HasWorldLocalizedName` trait.
     *
     * @param  array<string, mixed>  $raw     Vendor payload.
     * @param  string                $source  Deciding source.
     * @param  string                $locale  Locale for country-name resolution.
     */
    private function hydrate(string $ip, array $raw, string $source, string $locale): GeolocationData
    {
        $countryCode = $this->stringOrNull($raw['country_code'] ?? null);
        $countryName = $this->stringOrNull($raw['country_name'] ?? null);

        // Prefer the locale-aware translation when we can find the
        // country row locally; fall back to the vendor-reported
        // English name.
        if ($countryCode !== null) {
            $country = $this->countries->findByIso2($countryCode);
            if ($country !== null) {
                $countryName = $country->resolveLocalizedName($locale);
            }
        }

        return new GeolocationData(
            ip: $ip,
            countryCode: $countryCode,
            countryName: $countryName,
            stateCode: $this->stringOrNull($raw['state_code'] ?? null),
            stateName: $this->stringOrNull($raw['state_name'] ?? null),
            cityName: $this->stringOrNull($raw['city_name'] ?? null),
            postalCode: $this->stringOrNull($raw['postal_code'] ?? null),
            latitude: $this->floatOrNull($raw['latitude'] ?? null),
            longitude: $this->floatOrNull($raw['longitude'] ?? null),
            timezone: $this->stringOrNull($raw['timezone'] ?? null),
            accuracyRadius: isset($raw['accuracy_radius']) ? (int) $raw['accuracy_radius'] : null,
            source: $source,
        );
    }

    /**
     * Build the cache key for one `(ip, locale)` pair.
     */
    private function cacheKey(string $ip, string $locale): string
    {
        $prefix = (string) \config('geography.cache.prefix', 'geography.ref');

        return \sprintf('%s:geolocate:%s:%s', $prefix, \sha1($ip), $locale);
    }

    /**
     * Coerce a mixed vendor value to a nullable string.
     */
    private function stringOrNull(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Coerce a mixed vendor value to a nullable float.
     */
    private function floatOrNull(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }
}
