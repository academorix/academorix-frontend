<?php

/**
 * @file modules/shared/geography/config/geography.php
 *
 * @description
 * Runtime knobs for the `academorix/geography` module. Merged under the
 * `geography.*` key by the base ServiceProvider's LoadsResources concern.
 * Downstream modules read via `config('geography.*')` (never `env()` outside
 * this file per Octane-first rules).
 *
 * NOTE: the `nnjeim/world` vendor package has its own `config/world.php` that
 * we DO NOT edit — instead the service provider rebinds selected keys at
 * boot via `#[OnRegister]` so vendor relations return our subclasses.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Response cache (geography.cache middleware)
    |--------------------------------------------------------------------------
    |
    | Reference-catalog GET responses are cached in Redis for 1h TTL keyed by
    | `(path + query + locale)`. Anonymous bursts (marketing pages + signup
    | flows) get absorbed by cache rather than the DB.
    */
    'cache' => [
        'enabled' => (bool) env('GEOGRAPHY_CACHE_ENABLED', true),
        'ttl'     => (int) env('GEOGRAPHY_CACHE_TTL', 3600),
        'prefix'  => env('GEOGRAPHY_CACHE_PREFIX', 'geography.ref'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Geolocate (/geolocate endpoint)
    |--------------------------------------------------------------------------
    |
    | Rate-limiter cap per authenticated user, default source preference, and
    | fallback locale used when the caller doesn't specify one.
    */
    'geolocate' => [
        'rate_limit' => [
            'per_minute' => (int) env('GEOGRAPHY_GEOLOCATE_RATE_PER_MINUTE', 10),
        ],
        'default_locale' => env('GEOGRAPHY_GEOLOCATE_DEFAULT_LOCALE', 'en'),
        'prefer_source'  => env('GEOGRAPHY_GEOLOCATE_PREFER_SOURCE', 'maxmind'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Scheduled jobs
    |--------------------------------------------------------------------------
    |
    | Toggles for the weekly MaxMind refresh, hourly cache warming, and the
    | weekly reconciliation against the vendor seeder.
    */
    'schedule' => [
        'refresh_maxmind_weekly'  => (bool) env('GEOGRAPHY_REFRESH_MAXMIND_WEEKLY', true),
        'warm_cache_hourly'       => (bool) env('GEOGRAPHY_WARM_CACHE_HOURLY', true),
        'reconcile_vendor_weekly' => (bool) env('GEOGRAPHY_RECONCILE_VENDOR_WEEKLY', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | MaxMind GeoLite2
    |--------------------------------------------------------------------------
    |
    | The GeoLite2-City.mmdb path + a stale-days threshold. Register a free
    | account at maxmind.com to obtain a license key; without it, the
    | geolocate service falls back to ip-api.com (rate-limited, best-effort).
    */
    'maxmind' => [
        'license_key'   => env('MAXMIND_LICENSE_KEY'),
        'database_path' => env('GEOGRAPHY_MAXMIND_DATABASE_PATH', 'storage/app/geoip/GeoLite2-City.mmdb'),
        'stale_days'    => (int) env('GEOGRAPHY_MAXMIND_STALE_DAYS', 14),
    ],

    /*
    |--------------------------------------------------------------------------
    | Vendor overrides
    |--------------------------------------------------------------------------
    |
    | Rebound at GeographyServiceProvider's `#[OnRegister]` hook. These
    | override the values in vendor's `config/world.php` so vendor relations
    | (`Country::states`, `State::cities`, ...) return our subclasses.
    */
    'vendor_overrides' => [
        'models' => [
            'country'  => \Academorix\Geography\Models\Country::class,
            'state'    => \Academorix\Geography\Models\State::class,
            'city'     => \Academorix\Geography\Models\City::class,
            'currency' => \Academorix\Geography\Models\Currency::class,
            'language' => \Academorix\Geography\Models\Language::class,
            'timezone' => \Academorix\Geography\Models\Timezone::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Accepted locales
    |--------------------------------------------------------------------------
    |
    | Locales the `world.locale` middleware will honour for country-name
    | translation. Defaults to the 23 locales the vendor ships translations
    | for; consumer apps may append additional locales when they ship their
    | own translation catalog for `world::country.*`.
    */
    'accepted_locales' => [
        'ar', 'br', 'de', 'en', 'es', 'fr', 'hu', 'it', 'ja', 'ko',
        'nl', 'pl', 'pt-BR', 'pt', 'ro', 'ru', 'sk', 'sv', 'tr',
        'ua', 'zh-Hant', 'zh-Hans', 'zh',
    ],
];
