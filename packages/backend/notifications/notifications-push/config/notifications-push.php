<?php

/**
 * @file modules/notifications/notifications-push/config/notifications-push.php
 *
 * @description
 * Runtime knobs for the `stackra/notifications-push` module. Merged under
 * the `notifications-push.*` key by the base ServiceProvider's LoadsResources
 * concern. Every secret reference lives in Doppler; every default value is
 * safe for local dev.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Default provider
    |--------------------------------------------------------------------------
    |
    | Master default when a subscription's platform is ambiguous. Usually the
    | subscription's own `platform` column determines the provider — this is
    | the fallback for the rare case where we don't yet know.
    */
    'default' => env('NOTIFICATIONS_PUSH_DEFAULT', 'fcm'),

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    |
    | Per-provider credentials — every `*_secret_ref` value is a Doppler-managed
    | environment variable, never a plain-text secret in this file.
    */
    'providers' => [
        'fcm' => [
            'service_account_json_secret_ref' => env('FCM_SERVICE_ACCOUNT_JSON'),
            'project_id'                      => env('FCM_PROJECT_ID'),
        ],
        'apns' => [
            'auth_key_secret_ref' => env('APNS_AUTH_KEY'),
            'key_id'              => env('APNS_KEY_ID'),
            'team_id'             => env('APNS_TEAM_ID'),
            'bundle_id'           => env('APNS_BUNDLE_ID'),
            'environment'         => env('APNS_ENV', 'production'),
        ],
        'expo' => [
            'access_token_secret_ref' => env('EXPO_ACCESS_TOKEN'),
        ],
        'onesignal' => [
            'app_id'                  => env('ONESIGNAL_APP_ID'),
            'rest_api_key_secret_ref' => env('ONESIGNAL_REST_API_KEY'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhook signature secrets
    |--------------------------------------------------------------------------
    |
    | Per-provider inbound webhook signing secrets. Read by the webhook module's
    | verify middleware — the signature strategy shipped by this module knows
    | which key to look up per provider.
    */
    'webhook_secrets' => [
        'fcm'       => env('NOTIFICATIONS_PUSH_FCM_WEBHOOK_SECRET'),
        'apns'      => env('NOTIFICATIONS_PUSH_APNS_WEBHOOK_SECRET'),
        'onesignal' => env('NOTIFICATIONS_PUSH_ONESIGNAL_WEBHOOK_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Token validation
    |--------------------------------------------------------------------------
    |
    | Dry-run tokens against the provider at register time to catch bad tokens
    | before they waste send budget. `cache_ttl_seconds` prevents duplicate
    | dry-runs when the same token is submitted twice in rapid succession.
    */
    'token_validation' => [
        'enabled'           => (bool) env('NOTIFICATIONS_PUSH_TOKEN_VALIDATION_ENABLED', true),
        'cache_ttl_seconds' => (int) env('NOTIFICATIONS_PUSH_TOKEN_VALIDATION_CACHE_TTL', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Subscriptions past `idle_days` are soft-deleted. Minors get a shorter
    | retention window per COPPA. Soft-deleted rows are hard-purged after
    | `soft_delete_grace_days`.
    */
    'retention' => [
        'idle_days'              => (int) env('NOTIFICATIONS_PUSH_IDLE_DAYS', 90),
        'idle_days_minors'       => (int) env('NOTIFICATIONS_PUSH_IDLE_DAYS_MINORS', 30),
        'soft_delete_grace_days' => (int) env('NOTIFICATIONS_PUSH_SOFT_DELETE_GRACE_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payload limits
    |--------------------------------------------------------------------------
    |
    | Bytes. Enforced by the SendPushJob before the provider call; a payload
    | exceeding the limit is refused with NOTIFICATIONS_PUSH_PAYLOAD_TOO_LARGE.
    */
    'payload_limits' => [
        'fcm_max_bytes'       => (int) env('NOTIFICATIONS_PUSH_FCM_MAX_BYTES', 4096),
        'apns_max_bytes'      => (int) env('NOTIFICATIONS_PUSH_APNS_MAX_BYTES', 4096),
        'apns_voip_max_bytes' => (int) env('NOTIFICATIONS_PUSH_APNS_VOIP_MAX_BYTES', 5120),
    ],
];
