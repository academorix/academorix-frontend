<?php

/**
 * @file config/feature-flags.php
 *
 * @description
 * Runtime knobs for the `academorix/feature-flags` package.
 * Consumer apps publish this via
 * `php artisan vendor:publish --tag=feature-flags-config` and
 * override individual keys via environment. Every value here is
 * read exactly once at boot and threaded through the package's
 * checker + resolver layers.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache TTL
    |--------------------------------------------------------------------------
    |
    | Default cache TTL in seconds when a flag's `#[AsFeatureFlag]`
    | attribute did not declare an explicit `cacheTtl`. The checker
    | falls back to this value when resolving per-flag cache expiry.
    */
    'cache_ttl' => (int) env('FEATURE_FLAGS_CACHE_TTL', 300),

    /*
    |--------------------------------------------------------------------------
    | Cache store
    |--------------------------------------------------------------------------
    |
    | Cache-store name — must resolve to a driver Laravel understands.
    | `null` falls back to `config('cache.default')`. Tag-supporting
    | stores (Redis, Memcached) enable per-tenant tag flushing; other
    | stores fall through to the version-key strategy.
    */
    'cache_store' => env('FEATURE_FLAGS_CACHE_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Pennant driver
    |--------------------------------------------------------------------------
    |
    | Pennant driver name — `array` for stateless (Octane-safe,
    | default), `database` for persistent per-scope values. Because
    | this package resolves flags via its own layered pipeline, the
    | `array` driver is sufficient for production.
    */
    'pennant_store' => env('FEATURE_FLAGS_PENNANT_STORE', 'array'),

    /*
    |--------------------------------------------------------------------------
    | Boot payload timeout
    |--------------------------------------------------------------------------
    |
    | Timeout in milliseconds for the `BootPayloadContributor` batched
    | flag resolution on `GET /api/v1/me`. When the batched checker
    | exceeds this, the `features` key is omitted from the payload
    | (Requirement 7.6).
    */
    'boot_payload_timeout_ms' => (int) env('FEATURE_FLAGS_BOOT_PAYLOAD_TIMEOUT_MS', 500),

    /*
    |--------------------------------------------------------------------------
    | Kill-switch TTL cap
    |--------------------------------------------------------------------------
    |
    | Hard cap on kill-switch resolution TTL, regardless of the
    | flag's declared `cache_ttl` (Requirement 10.7). Keeps
    | emergency shut-offs responsive.
    */
    'kill_switch_max_ttl' => 60,
];
