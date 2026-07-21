<?php

/**
 * @file modules/notifications/notifications/config/notifications.php
 *
 * @description
 * Runtime knobs for the `stackra/notifications` module. Merged under
 * the `notifications.*` key by the base ServiceProvider's LoadsResources
 * concern. Downstream modules read via `config('notifications.*')` —
 * never `env()` outside this file per Octane-first rules.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Dispatch kill switch
    |--------------------------------------------------------------------------
    |
    | Master kill-switch. When off, `DispatchGatewayInterface::dispatch()`
    | short-circuits and returns null without persisting or dispatching.
    | Reserved for incident-response — if the volume of notifications
    | themselves is the incident, flip this off.
    */
    'enabled' => (bool) env('NOTIFICATIONS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Queues
    |--------------------------------------------------------------------------
    |
    | Queue names + criticality mapping. Channel modules read these
    | to route their SendJob to the right queue.
    */
    'queues' => [
        'critical' => env('NOTIFICATIONS_QUEUE_CRITICAL', 'notifications-critical'),
        'default'  => env('NOTIFICATIONS_QUEUE_DEFAULT', 'notifications'),
        'digests'  => env('NOTIFICATIONS_QUEUE_DIGESTS', 'notifications-digests'),
        'webhooks' => env('NOTIFICATIONS_QUEUE_WEBHOOKS', 'notifications-webhooks'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retry
    |--------------------------------------------------------------------------
    |
    | Retry backoff schedule for channel-module SendJobs. Channel
    | modules import this shape for their #[Backoff(...)] attribute.
    */
    'retry' => [
        'backoff_seconds' => [30, 120, 600, 3600, 21600, 86400],
        'max_attempts'    => (int) env('NOTIFICATIONS_MAX_ATTEMPTS', 6),
    ],

    /*
    |--------------------------------------------------------------------------
    | Digests
    |--------------------------------------------------------------------------
    |
    | Digest scheduling defaults. Per-user overrides live on
    | `notification_preferences.quiet_hours_*` + `digest_mode`.
    */
    'digests' => [
        'daily_time'  => env('NOTIFICATIONS_DIGESTS_DAILY_TIME', '08:00'),
        'weekly_day'  => env('NOTIFICATIONS_DIGESTS_WEEKLY_DAY', 'monday'),
        'weekly_time' => env('NOTIFICATIONS_DIGESTS_WEEKLY_TIME', '09:00'),
        'min_items'   => (int) env('NOTIFICATIONS_DIGESTS_MIN_ITEMS', 1),
        'max_items'   => (int) env('NOTIFICATIONS_DIGESTS_MAX_ITEMS', 50),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache TTLs
    |--------------------------------------------------------------------------
    |
    | Cache TTLs (seconds) for the registry + resolver caches.
    */
    'caches' => [
        'category_registry_ttl' => (int) env('NOTIFICATIONS_CACHE_CATEGORY_TTL', 3600),
        'template_registry_ttl' => (int) env('NOTIFICATIONS_CACHE_TEMPLATE_TTL', 900),
        'preference_ttl'        => (int) env('NOTIFICATIONS_CACHE_PREFERENCE_TTL', 600),
        'recipient_ttl'         => (int) env('NOTIFICATIONS_CACHE_RECIPIENT_TTL', 900),
        'unseen_count_ttl'      => (int) env('NOTIFICATIONS_CACHE_UNSEEN_TTL', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | Dispatch API
    |--------------------------------------------------------------------------
    */
    'dispatch' => [
        'async_by_default'       => (bool) env('NOTIFICATIONS_ASYNC_BY_DEFAULT', true),
        'per_tenant_rate_limit'  => env('NOTIFICATIONS_PER_TENANT_RATE_LIMIT'),
        'critical_channels'      => ['mail', 'in_app', 'push'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Unsubscribe
    |--------------------------------------------------------------------------
    |
    | Signed unsubscribe URL config. `token_ttl_days` bounds how long
    | a signed link stays valid; once unsubscribed, the preference row
    | persists even after the token expires.
    */
    'unsubscribe' => [
        'token_ttl_days'          => (int) env('NOTIFICATIONS_UNSUBSCRIBE_TOKEN_TTL_DAYS', 30),
        'honour_within_seconds'   => (int) env('NOTIFICATIONS_UNSUBSCRIBE_HONOUR_WITHIN', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Retention windows in days. `ExpungeArchivedNotificationsJob`
    | reads these to compute cutoffs.
    */
    'retention' => [
        'archived_notification_days' => (int) env('NOTIFICATIONS_RETENTION_ARCHIVED_DAYS', 30),
        'delivery_days'              => (int) env('NOTIFICATIONS_RETENTION_DELIVERY_DAYS', 90),
        'digest_days'                => (int) env('NOTIFICATIONS_RETENTION_DIGEST_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Resolvers
    |--------------------------------------------------------------------------
    */
    'resolvers' => [
        'preference_fallback_order'       => ['user', 'tenant', 'platform'],
        'quiet_hours_bypass_for_critical' => (bool) env('NOTIFICATIONS_QUIET_HOURS_BYPASS_CRITICAL', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Emails render pipeline
    |--------------------------------------------------------------------------
    */
    'emails' => [
        'manifest_path'       => env(
            'NOTIFICATIONS_EMAILS_MANIFEST_PATH',
            'packages/notifications-emails-renderer/dist/manifest.json',
        ),
        'artifact_base_url'   => env('NOTIFICATIONS_EMAILS_ARTIFACT_BASE_URL'),
        'blade_strict'        => (bool) env('NOTIFICATIONS_EMAILS_BLADE_STRICT', true),
    ],
];
