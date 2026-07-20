<?php

/**
 * @file modules/platform/application/config/application.php
 *
 * @description
 * Runtime knobs for the `academorix/application` module. Merged under
 * the `application.*` key by the base ServiceProvider's LoadsResources
 * concern. Consumer overrides via `.env`; downstream modules read via
 * `config('application.*')` (never `env()` outside this file — see
 * `.kiro/steering/octane-first-di.md` §4).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Default Application slug
    |--------------------------------------------------------------------------
    |
    | The Application row used when host resolution finds no matching row
    | (fresh install, misconfigured DNS). Referenced by ResolveApplication
    | middleware and the `application:sync-catalogue` seeder.
    */
    'default_slug' => env('APPLICATION_DEFAULT_SLUG', 'academorix'),

    /*
    |--------------------------------------------------------------------------
    | BusinessType — dual-source config
    |--------------------------------------------------------------------------
    |
    | The BusinessType catalogue is dual-source: the `BusinessTypeEnum` is
    | code-primary (compile-time branching, PHPStan-verified); the
    | `business_types` table is the admin-visible mirror. This block
    | controls the SEEDER's behaviour — never bypass by writing directly
    | to `business_types` outside a seeder (see the observer guardrail).
    */
    'business_types' => [
        // Seeder priority — matches BusinessTypeSeeder's `#[AsSeeder(priority: 20)]`.
        // Landed in the framework/tenancy tier (10-29 range per steering).
        'seeder_priority' => 20,

        // Whether tenant admins may create custom BusinessType rows
        // (`is_system = false`). When false, only platform-seeded rows exist.
        'allow_tenant_customs' => env('APPLICATION_ALLOW_TENANT_CUSTOM_BUSINESS_TYPES', true),

        // Icon token registry — Iconify slugs used by the FE picker widget.
        // Overrides the per-case default in BusinessTypeEnum's iconToken().
        'icon_overrides' => [
            // 'sports_center' => 'my-custom-icon',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Application rows soft-delete (archived, never hard-deleted).
    | `#[AsRetentionPolicy]` on the model declares the archive window;
    | this config block overrides the default when a caller needs
    | non-standard retention (never used in prod, kept for parity).
    */
    'retention' => [
        'archive_after_days' => env('APPLICATION_ARCHIVE_AFTER_DAYS', 730),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sync command
    |--------------------------------------------------------------------------
    |
    | `php artisan application:sync-catalogue` mirrors `BusinessTypeEnum::cases()`
    | into `business_types` on every deploy. Idempotent — safe to run repeatedly.
    */
    'sync_command' => [
        // Environments the sync command runs in automatically (via a scheduler
        // entry). Empty = run in every environment via post-deploy hook.
        'auto_run_environments' => [],
    ],
];
