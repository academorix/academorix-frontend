<?php

/**
 * @file packages/backend/telemetry/horizon/config/horizon-notifications.php
 *
 * @description
 * Notification-routing configuration for the Horizon dashboard.
 * The values here are read at BOOT (via `mergeConfigFrom` in
 * `HorizonServiceProvider::configureNotifications()`), so `env()`
 * calls in this file honour Laravel's config cache — same shape
 * every other `config/*.php` file across the monorepo follows.
 *
 * Under Octane the file is loaded once per worker; the values are
 * captured in the shared config repository and every subsequent
 * `config('horizon-notifications.*')` read is O(1) — no env
 * re-parse per request (`.kiro/steering/octane-first-di.md`
 * §Rules-don't #4).
 *
 * Migrated from direct `env()` reads inside
 * `HorizonServiceProvider::configureNotifications()` on
 * 2026-07-21 (Phase E5) — the previous shape bypassed the config
 * cache on every boot and violated the Octane-first DI mandate.
 *
 * @category Config
 *
 * @since    0.1.0
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Mail Notifications
    |--------------------------------------------------------------------------
    |
    | Address that receives Horizon's long-wait / failed-job
    | notifications by email. `null` disables the mail channel.
    */
    'mail' => env('HORIZON_MAIL_NOTIFICATIONS'),

    /*
    |--------------------------------------------------------------------------
    | Slack Notifications
    |--------------------------------------------------------------------------
    |
    | Slack incoming-webhook URL + channel. `webhook` is the
    | required piece; `channel` defaults to `#horizon` when unset.
    */
    'slack' => [
        'webhook' => env('HORIZON_SLACK_WEBHOOK'),
        'channel' => env('HORIZON_SLACK_CHANNEL', '#horizon'),
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Notifications
    |--------------------------------------------------------------------------
    |
    | Phone number that receives Horizon's SMS notifications.
    | `null` disables the SMS channel.
    */
    'sms' => env('HORIZON_SMS_NOTIFICATIONS'),
];
