<?php

/**
 * @file packages/compliance/retention/config/retention.php
 *
 * @description
 * Runtime configuration for `stackra/retention`. Merged into
 * the consuming app under the `retention.*` key by
 * {@see RetentionServiceProvider}
 * (via the base's `#[LoadsResources(config: true)]` convention).
 *
 * ## Sections
 *
 *   - `schedule.*` — cron cadence + master enable flag.
 *   - `batch_size` — safeguard cap on rows deleted per policy run.
 *   - `dry_run_default` — global preview switch; forces every
 *     scheduled invocation into dry-run without a code change.
 *
 * Values are chosen as safe production defaults for a multi-tenant
 * deployment. Every knob honours an env override so ops can flip
 * behaviour per environment via Doppler without a code deploy.
 *
 * ## Env vars
 *
 *   - `RETENTION_SCHEDULE_ENABLED` (bool, default `true`)
 *   - `RETENTION_SCHEDULE_CRON`    (string, default `'0 3 * * *'`)
 *   - `RETENTION_BATCH_SIZE`       (int, default `1000`)
 *   - `RETENTION_DRY_RUN`          (bool, default `false`)
 */

declare(strict_types=1);
use Stackra\Retention\Providers\RetentionServiceProvider;

return [

    /*
    |--------------------------------------------------------------------------
    | Schedule cadence + master enable
    |--------------------------------------------------------------------------
    |
    | The scheduled `compliance:retention:run` command carries a
    | `#[Cron('0 3 * * *')]` attribute today — this section reserves
    | the config surface so a future revision can honour a
    | config-driven override once the scheduling package exposes
    | one. The master `enabled` toggle is honoured immediately by
    | ops overriding via env in a staging environment where
    | per-tenant retention churn is undesirable.
    |
    */

    'schedule' => [
        'enabled' => (bool) env('RETENTION_SCHEDULE_ENABLED', true),
        'cron' => (string) env('RETENTION_SCHEDULE_CRON', '0 3 * * *'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Batch size
    |--------------------------------------------------------------------------
    |
    | Maximum rows the runner will touch per policy invocation.
    | Reserved for future runner iterations that opt into batched
    | deletes; the v1 `Delete` branch issues a single UPDATE ...
    | WHERE query and doesn't apply this cap yet.
    |
    | Kept in config so consumers can pre-configure once the
    | batched-delete iteration lands.
    |
    */

    'batch_size' => (int) env('RETENTION_BATCH_SIZE', 1000),

    /*
    |--------------------------------------------------------------------------
    | Global dry-run default
    |--------------------------------------------------------------------------
    |
    | When `true`, the runner is expected to force `--dry-run`
    | semantics regardless of the scheduled invocation's flags.
    | Useful during a staged rollout to production — flip
    | `RETENTION_DRY_RUN=true` for a scheduled cycle to preview
    | what would delete, then flip back once the counts are
    | validated.
    |
    | v1 status: honoured by the console command (planned) but
    | the current `handle()` respects only the explicit
    | `--dry-run` CLI flag. A follow-up will merge this default
    | into the resolved flag so scheduled invocations honour it.
    |
    */

    'dry_run_default' => (bool) env('RETENTION_DRY_RUN', false),

];
