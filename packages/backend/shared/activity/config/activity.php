<?php

/**
 * @file modules/shared/activity/config/activity.php
 *
 * @description
 * Runtime knobs for the `academorix/activity` module. Merged under the
 * `activity.*` key by the base ServiceProvider's LoadsResources concern.
 * Downstream modules read via `config('activity.*')` (never `env()` outside
 * this file per Octane-first rules).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Feature flag
    |--------------------------------------------------------------------------
    |
    | Master kill-switch. When disabled, HasActivityLog no-ops without
    | writing rows. Useful during incident response when the log volume
    | itself is the incident.
    */
    'enabled' => env('ACTIVITY_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Spatie activitylog bridge
    |--------------------------------------------------------------------------
    |
    | We do not overwrite spatie's own config/activitylog.php. Values here
    | are applied by our provider at boot so consumer apps only publish
    | one file (`activity.php`).
    */
    'database' => [
        'connection' => env('ACTIVITY_DB_CONNECTION'),
    ],

    'table_name' => env('ACTIVITY_TABLE_NAME', 'activity_log'),

    /*
    |--------------------------------------------------------------------------
    | Log-name defaults
    |--------------------------------------------------------------------------
    |
    | Fallback log_name when a model composes HasActivityLog without
    | overriding `activityLogName()`. The trait defaults to the short
    | class name (kebab-case) — this is the master fallback for the rare
    | anonymous / dynamic model.
    */
    'log_name' => [
        'default' => env('ACTIVITY_DEFAULT_LOG_NAME', 'default'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention windows
    |--------------------------------------------------------------------------
    |
    | Tier windows in days. `PruneActivityLogJob` reads these + the tier
    | resolved from the tenant's active subscription to compute the
    | cutoff. Downgrade path is a wider window; upgrade path is narrower.
    | Every window is exclusive at the boundary: `created_at < cutoff`.
    */
    'retention' => [
        'tier_days' => [
            'starter' => (int) env('ACTIVITY_RETENTION_STARTER_DAYS', 30),
            'growth'  => (int) env('ACTIVITY_RETENTION_GROWTH_DAYS', 90),
            'pro'     => (int) env('ACTIVITY_RETENTION_PRO_DAYS', 365),
        ],
        'default_tier'      => env('ACTIVITY_RETENTION_DEFAULT_TIER', 'starter'),
        'prune_chunk_size'  => (int) env('ACTIVITY_PRUNE_CHUNK_SIZE', 1000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Causer resolution
    |--------------------------------------------------------------------------
    |
    | Which auth guard resolves the causer. `sanctum` is the tenant-user
    | guard; `platform_admin` produces a `PlatformUser` causer for
    | platform-audience mutations.
    */
    'causer' => [
        'guard'                 => env('ACTIVITY_CAUSER_GUARD', 'sanctum'),
        'fallback_to_system'    => (bool) env('ACTIVITY_FALLBACK_TO_SYSTEM', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Batching
    |--------------------------------------------------------------------------
    |
    | Spatie's LogBatch::startBatch() groups related activities under one
    | `batch_uuid`. Disable when a downstream consumer can't handle the
    | grouping (rare).
    */
    'batching' => [
        'enabled' => (bool) env('ACTIVITY_BATCHING_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Redacted property paths
    |--------------------------------------------------------------------------
    |
    | Dot-paths applied to the `properties` JSONB before serialisation
    | in `ActivityData`. Prevents accidental PII / secret leakage into
    | the feed UI. `spatie/laravel-activitylog` writes whatever
    | `logOnly()` on the model allows — this is the second line of
    | defence when the model's own filter drifts.
    */
    'redacted_property_paths' => [
        'attributes.password',
        'attributes.remember_token',
        'attributes.api_token',
        'attributes.mfa_secret',
        'old.password',
        'old.remember_token',
        'old.api_token',
        'old.mfa_secret',
    ],
];
