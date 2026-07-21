<?php

/**
 * @file packages/health/config/health.php
 *
 * @description
 * Baseline `health.*` config merged by
 * {@see \Stackra\Health\Providers\HealthServiceProvider::register()}.
 *
 * Consumers publish this file to their app's `config/` directory
 * with:
 *
 *   php artisan vendor:publish --tag=health-config
 *
 * ... and then override the notification routing per-environment
 * via env vars.
 *
 * ## Rule of thumb
 *
 * The MAP below is keyed by the string value of a
 * {@see \Stackra\Health\Enums\HealthNotificationChannel} case.
 * That coupling is intentional — every check in every package
 * routes by enum case, so the config key MUST match the case value
 * or resolution silently misses.
 *
 * If you add a new channel case to the enum, remember to add the
 * matching config block here.
 */

declare(strict_types=1);

use Stackra\Health\Enums\HealthNotificationChannel;

return [

    /*
    |--------------------------------------------------------------------------
    | Notification channels
    |--------------------------------------------------------------------------
    |
    | Map each logical HealthNotificationChannel case to a concrete
    | notifiable configuration. The key MUST match the case's string
    | value; the resolver in HealthNotificationConfig::resolveChannel()
    | looks up `health.notifications.<case-value>`.
    |
    | Every entry MUST declare a `driver` key. The remaining fields
    | are driver-specific and consumed by whatever notification
    | routing layer Spatie's Health facade calls into.
    |
    | Leave an entry as `null` (or omit it) to declare that the
    | channel is intentionally unrouted in this environment — the
    | discoverer will warn (not fail) when a check references an
    | unrouted channel.
    |
    */

    'notifications' => [
        HealthNotificationChannel::SlackPlatformEng->value => [
            'driver' => 'slack',
            'webhook' => env('HEALTH_SLACK_PLATFORM_ENG_WEBHOOK'),
        ],

        HealthNotificationChannel::SlackOps->value => [
            'driver' => 'slack',
            'webhook' => env('HEALTH_SLACK_OPS_WEBHOOK'),
        ],

        HealthNotificationChannel::SlackSecurity->value => [
            'driver' => 'slack',
            'webhook' => env('HEALTH_SLACK_SECURITY_WEBHOOK'),
        ],

        HealthNotificationChannel::PagerDuty->value => [
            'driver' => 'pagerduty',
            'integration_key' => env('HEALTH_PAGERDUTY_INTEGRATION_KEY'),
        ],

        HealthNotificationChannel::Email->value => [
            'driver' => 'mail',
            'to' => env('HEALTH_EMAIL_TO'),
        ],

        HealthNotificationChannel::LogOnly->value => [
            'driver' => 'log',
            'channel' => env('HEALTH_LOG_CHANNEL', 'daily'),
        ],
    ],

];
