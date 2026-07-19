<?php

/**
 * @file modules/platform/settings/config/settings.php
 *
 * @description
 * Runtime knobs for the `academorix/settings` module. Overrides on
 * top of `spatie/laravel-settings` sit under the `spatie` key so the
 * upstream package's own `config/settings.php` stays untouched.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Spatie bridge
    |--------------------------------------------------------------------------
    |
    | We wrap `spatie/laravel-settings` for the storage substrate.
    | These knobs project onto that library's own config.
    */
    'spatie' => [
        'database_connection' => \env('SETTINGS_DB_CONNECTION'),
        'repository'          => \env('SETTINGS_REPOSITORY', 'database'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | The Eloquent SettingValue repository ships
    | `#[Cacheable(ttl: 3600, tags: true)]`. `resolver.cache_ttl_seconds`
    | is the shorter TTL used by the resolver's memoisation layer —
    | keeps hot-path reads fast without stale values.
    */
    'cache' => [
        'store' => \env('SETTINGS_CACHE_STORE'),
        'ttl'   => (int) \env('SETTINGS_CACHE_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Discovery
    |--------------------------------------------------------------------------
    |
    | Compile-time artefact + failure-mode knobs for the boot-time
    | `#[AsSetting]` discovery pass.
    */
    'discovery' => [
        'cache_path'                => \env(
            'SETTINGS_DISCOVERY_CACHE_PATH',
            'bootstrap/cache/settings-registry.php',
        ),
        'fail_on_duplicate_group'   => (bool) \env('SETTINGS_FAIL_ON_DUPLICATE_GROUP', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Resolver
    |--------------------------------------------------------------------------
    |
    | The resolver walks user → tenant → system by default. Raise the
    | max depth when the scope module adds org / branch levels.
    */
    'resolver' => [
        'cache_ttl_seconds'  => (int) \env('SETTINGS_RESOLVER_CACHE_TTL', 600),
        'max_cascade_depth'  => (int) \env('SETTINGS_MAX_CASCADE_DEPTH', 3),
        'default_scope_kind' => \env('SETTINGS_DEFAULT_SCOPE_KIND', 'system'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Encryption
    |--------------------------------------------------------------------------
    |
    | When `encrypt_sensitive_at_rest` is on, the
    | `EncryptedSensitiveSettingCast` uses Laravel's Crypt facade to
    | encrypt/decrypt values whose owning schema flags
    | `sensitive: true`. Enterprise apps may swap in a KMS-backed
    | variant.
    */
    'encrypt_sensitive_at_rest' => (bool) \env('SETTINGS_ENCRYPT_SENSITIVE', false),

    'kms' => [
        'key_alias' => \env('SETTINGS_KMS_KEY_ALIAS', 'alias/academorix-settings'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sensitive reveal
    |--------------------------------------------------------------------------
    |
    | Every `?reveal=true` on a sensitive field writes a fresh audit
    | row when this is on. Off = only meta-analytics tracked (weaker
    | audit trail — enterprise deployments should keep this on).
    */
    'sensitive_reveal' => [
        'log_every_use' => (bool) \env('SETTINGS_SENSITIVE_REVEAL_LOG', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | SettingValue rows are kept for the lifetime of their owning
    | scope. The retention window here applies to the settings-scoped
    | rows in `activity_log` + `audits` (per-module policies still
    | apply on top).
    */
    'retention' => [
        'activity_days_default' => (int) \env('SETTINGS_ACTIVITY_DAYS', 90),
        'audit_days_default'    => (int) \env('SETTINGS_AUDIT_DAYS', 365),
    ],
];
