<?php

/**
 * @file modules/billing/entitlements/config/entitlements.php
 *
 * @description
 * Runtime knobs for the `stackra/entitlements` module. Every knob
 * is env-overridable so per-environment tuning stays out of code.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    |
    | The resolver caches (`tenant_id`, `key`) → Entitlement lookups in the
    | hot path. A very short TTL — the observer flushes tenant tags on
    | writes so overrides + plan syncs propagate immediately.
    */
    'cache' => [
        'ttl' => env('ENTITLEMENTS_CACHE_TTL', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Enforcement
    |--------------------------------------------------------------------------
    |
    | Master switch — set `enabled=false` to disable every entitlement
    | check (useful during initial rollout before quotas are seeded).
    | `warn_threshold` fires `EntitlementApproachingCap` when `used`
    | crosses that fraction of the cap.
    */
    'enforcer' => [
        'enabled'        => env('ENTITLEMENTS_ENFORCEMENT_ENABLED', true),
        'warn_threshold' => env('ENTITLEMENTS_WARN_THRESHOLD', 0.8),
        'strict_mode'    => env('ENTITLEMENTS_STRICT_MODE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis
    |--------------------------------------------------------------------------
    |
    | Redis is the drift-tolerant hot cache for counter increments;
    | Postgres is the source of truth. `tolerance` caps the max Redis-
    | Postgres drift before `ReconcileUsageJob` writes a correction.
    */
    'redis' => [
        'connection' => env('ENTITLEMENTS_REDIS_CONNECTION', 'default'),
        'key_prefix' => env('ENTITLEMENTS_REDIS_PREFIX', 'quota:'),
        'tolerance'  => env('ENTITLEMENTS_REDIS_TOLERANCE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    |
    | Applies to `pool`-kind entitlements. `scan_batch_size` bounds the
    | number of rows touched per `ResetPeriodicUsageJob` invocation.
    */
    'reset' => [
        'scan_batch_size'          => env('ENTITLEMENTS_RESET_BATCH_SIZE', 500),
        'month_boundary_timezone'  => env('ENTITLEMENTS_MONTH_TZ', 'UTC'),
        'default_period'           => env('ENTITLEMENTS_DEFAULT_PERIOD', 'monthly'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Billing export
    |--------------------------------------------------------------------------
    |
    | Applies to metered-billing entitlements — usage rows exported to
    | Stripe / Paddle at billing period end. `idempotency_window_hours`
    | is the window during which the provider dedup's usage records via
    | our correlation id.
    */
    'billing_export' => [
        'enabled'                   => env('ENTITLEMENTS_BILLING_EXPORT_ENABLED', false),
        'provider_timeout_seconds'  => env('ENTITLEMENTS_BILLING_TIMEOUT', 30),
        'idempotency_window_hours'  => env('ENTITLEMENTS_BILLING_IDEMPOTENCY_HOURS', 168),
    ],

    /*
    |--------------------------------------------------------------------------
    | Usage partitioning
    |--------------------------------------------------------------------------
    |
    | Monthly partitions on `entitlement_usages` are pre-created ahead of
    | time by the (unshipped in v1) `CreatePartitionsJob`. Retention
    | falls back to `retention_days_default` when the entitlement's
    | `usage_history.retention_days` cannot be resolved.
    */
    'usage_partitioning' => [
        'pre_create_months'      => env('ENTITLEMENTS_PARTITIONS_PRECREATE', 3),
        'retention_days_default' => env('ENTITLEMENTS_RETENTION_DEFAULT', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reserved keys
    |--------------------------------------------------------------------------
    |
    | Well-known entitlement keys built into the platform. Domain modules
    | declare their keys via `#[ConsumesEntitlement]` at boot; this list
    | is the shortlist we cross-reference in `entitlements:describe`.
    */
    'reserved_keys' => [
        'storage.bytes.consumed',
        'webhook.subscriptions.max',
        'newsletter.campaigns.month',
        'ai.tokens.month',
        'notifications.email.month',
        'notifications.sms.month',
        'notifications.push.month',
    ],
];
