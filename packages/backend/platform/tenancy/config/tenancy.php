<?php

/**
 * @file modules/platform/tenancy/config/tenancy.php
 *
 * @description
 * Runtime knobs for the `academorix/tenancy` module. Merged under the
 * `tenancy.*` key by the base ServiceProvider's LoadsResources concern.
 * Downstream modules read via `config('tenancy.*')` (never `env()`
 * outside this file per Octane-first rules).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Hosts + reserved slugs
    |--------------------------------------------------------------------------
    */
    'hosts' => [
        'reserved_slugs' => [
            'www', 'api', 'admin', 'mail', 'blog', 'platform', 'app',
            'static', 'cdn', 'help', 'support', 'status',
        ],
        'cache_ttl_seconds' => env('TENANCY_HOST_CACHE_TTL', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Provisioning defaults
    |--------------------------------------------------------------------------
    */
    'provisioning' => [
        'default_trial_days' => env('TENANCY_DEFAULT_TRIAL_DAYS', 14),
        'grace_days_after_payment_failure' => env('TENANCY_GRACE_DAYS', 7),
        'default_locale'   => 'en',
        'default_timezone' => 'UTC',
        'default_currency' => 'USD',
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Cascaded to `#[AsRetentionPolicy]` on the Tenant model + read by
    | `tenancy:hard-delete-archived`.
    */
    'retention' => [
        'tenant_hard_delete_days'         => env('TENANCY_TENANT_HARD_DELETE_DAYS', 30),
        'contact_hard_delete_days'        => env('TENANCY_CONTACT_HARD_DELETE_DAYS', 30),
        'dpo_legal_contact_hold_years'    => env('TENANCY_DPO_LEGAL_HOLD_YEARS', 7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache TTLs
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'branding_ttl'    => env('TENANCY_BRANDING_TTL', 3600),
        'features_ttl'    => env('TENANCY_FEATURES_TTL', 300),
        'my_tenants_ttl'  => env('TENANCY_MY_TENANTS_TTL', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit + monitoring
    |--------------------------------------------------------------------------
    */
    'audit' => [
        'cross_tenant_alert_channel'  => env('TENANCY_ALERT_CHANNEL', 'security'),
        'persist_denied_requests'     => env('TENANCY_PERSIST_DENIED', true),
    ],
];
