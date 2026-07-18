<?php

/**
 * @file modules/shared/audit/config/audit.php
 *
 * @description
 * Runtime knobs for the `academorix/audit` module. Merged under the
 * `audit.*` key by the base ServiceProvider's LoadsResources concern.
 *
 * Overrides on top of owen-it/laravel-auditing's own `config/audit.php`
 * (the vendor config still governs the driver, resolvers, and event
 * catalog). Values here scope how OUR extensions behave — KMS envelope
 * encryption, tamper-evident chain, hot/cold retention windows, and the
 * tenant-DPO HTTP surface toggle.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    |
    | Kept aligned with owen-it's default (`audits`). Override only when a
    | consumer app has a legacy audit table name.
    */
    'table_name' => env('AUDIT_TABLE_NAME', 'audits'),

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Hot phase = Postgres row lifetime. Cold phase = S3 Glacier (or the
    | platform's configured cold driver) with Object Lock. Anonymise-not-
    | delete on the 2555-day (7y) boundary — row_hash + previous_hash are
    | preserved so the chain stays verifiable post-anonymisation.
    */
    'retention' => [
        'hot_days'  => env('AUDIT_RETENTION_HOT_DAYS', 365),
        'cold_days' => env('AUDIT_RETENTION_COLD_DAYS', 2555),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tamper-evident chain
    |--------------------------------------------------------------------------
    |
    | Enterprise-only by default. Non-enterprise tenants store rows without
    | `chain_hash` populated (NULL); enterprise tenants receive SHA-512 of
    | the canonical serialisation + previous row's `chain_hash`.
    */
    'chain' => [
        'enabled_default'         => env('AUDIT_CHAIN_ENABLED', true),
        'algorithm'               => env('AUDIT_CHAIN_ALGORITHM', 'sha512'),
        'verify_sample_per_run'   => env('AUDIT_CHAIN_VERIFY_SAMPLE', 10000),
    ],

    /*
    |--------------------------------------------------------------------------
    | KMS envelope encryption
    |--------------------------------------------------------------------------
    |
    | The default `NullKmsCipher` delegates to Laravel's `Crypt` facade —
    | good enough for dev + tests. Production apps bind a real KMS-backed
    | cipher via `#[Bind(KmsCipherInterface::class)]`.
    */
    'kms' => [
        'driver'                 => env('AUDIT_KMS_DRIVER', 'local'),
        'key_id'                 => env('AUDIT_KMS_KEY_ID'),
        'region'                 => env('AUDIT_KMS_REGION', 'us-east-1'),
        'async_threshold_bytes'  => env('AUDIT_KMS_ASYNC_THRESHOLD_BYTES', 32768),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant DPO surface
    |--------------------------------------------------------------------------
    |
    | Toggles the tenant-facing `/api/v1/audits` routes. Platform admin
    | routes are always on. Sensitive-tier fields stay masked as
    | `[REDACTED]` on the tenant surface regardless of this flag.
    */
    'tenant_surface_enabled' => env('AUDIT_TENANT_SURFACE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Cold storage
    |--------------------------------------------------------------------------
    */
    'cold' => [
        'driver'            => env('AUDIT_COLD_DRIVER', 's3'),
        'bucket'            => env('AUDIT_COLD_BUCKET', 'academorix-audit-cold'),
        'rotate_batch_size' => env('AUDIT_COLD_ROTATE_BATCH_SIZE', 1000),
        'object_lock_mode'  => env('AUDIT_COLD_OBJECT_LOCK_MODE', 'COMPLIANCE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Redacted paths
    |--------------------------------------------------------------------------
    |
    | Keys inside `old_values` / `new_values` JSON that are masked on the
    | tenant DPO surface regardless of the caller's role. Additive on top
    | of every model's own `#[Auditable(encryptFields: ...)]` list.
    */
    'redacted_paths' => [
        'password',
        'password_hash',
        'remember_token',
        'api_token',
        'access_token',
        'refresh_token',
    ],
];
