<?php

/**
 * @file modules/notifications/notifications-in-app/config/notifications-in-app.php
 *
 * @description
 * Runtime knobs for the `academorix/notifications-in-app` module.
 * Merged under the `notifications-in-app.*` key by the base
 * ServiceProvider's LoadsResources concern. Downstream code reads via
 * `config('notifications-in-app.*')` (never `env()` outside this file
 * per Octane-first rules).
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Feature flag
    |--------------------------------------------------------------------------
    |
    | Master kill-switch. When disabled, the listener + observer no-op
    | without writing DB rows or emitting broadcasts. Useful during
    | incident response when the log volume itself is the incident.
    */
    'enabled' => env('NOTIFICATIONS_INAPP_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Broadcast dispatch
    |--------------------------------------------------------------------------
    |
    | Every dispatched in-app notification triggers a WebSocket
    | broadcast on `user.{id}.notifications`. Disable to run in
    | DB-only mode (clients poll instead of receiving live updates).
    */
    'broadcast' => [
        'enabled'              => (bool) env('NOTIFICATIONS_INAPP_BROADCAST_ENABLED', true),
        'driver'               => env('NOTIFICATIONS_INAPP_BROADCAST_DRIVER', 'reverb'),
        'batch_threshold'      => (int) env('NOTIFICATIONS_INAPP_BATCH_THRESHOLD', 5),
        'batch_window_seconds' => (int) env('NOTIFICATIONS_INAPP_BATCH_WINDOW_SECONDS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reverb tuning
    |--------------------------------------------------------------------------
    |
    | Reverb-specific tuning knobs. Ignored when the broadcast driver
    | is not `reverb`.
    */
    'reverb' => [
        'admin_url'         => env('REVERB_ADMIN_URL'),
        'probe_timeout_ms'  => (int) env('NOTIFICATIONS_INAPP_REVERB_PROBE_TIMEOUT_MS', 500),
    ],

    /*
    |--------------------------------------------------------------------------
    | Channel key
    |--------------------------------------------------------------------------
    |
    | The channel identifier this driver registers with the parent's
    | NotificationChannelRegistry. Matches NotificationChannel::InApp.
    */
    'channel_key' => 'in_app',

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Per-tier retention windows in days. The retention pruner reads
    | these + the tier resolved from the tenant's active subscription
    | to compute the cutoff. Overrides the parent notifications
    | module's defaults for in-app-flavored rows.
    */
    'retention' => [
        'hot_days'  => (int) env('NOTIFICATIONS_INAPP_HOT_DAYS', 180),
        'cold_days' => (int) env('NOTIFICATIONS_INAPP_COLD_DAYS', 365),
    ],

    /*
    |--------------------------------------------------------------------------
    | Unread-count cache
    |--------------------------------------------------------------------------
    |
    | The `/unread-count` endpoint caches the count per (tenant, user)
    | for a short window to shave load off the badge poll cadence.
    */
    'unread_count' => [
        'cache_ttl_seconds' => (int) env('NOTIFICATIONS_INAPP_UNREAD_CACHE_TTL', 30),
    ],
];
