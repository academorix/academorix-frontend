<?php

/**
 * @file modules/platform/webhook/config/webhook.php
 *
 * @description
 * Runtime knobs for the `stackra/webhook` module. Every knob is
 * env-overridable so per-environment tuning stays out of code.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Signing
    |--------------------------------------------------------------------------
    |
    | HMAC-SHA256 signing config. `rotation_grace_seconds` is the window
    | during which `signing_secret_previous` is still trusted, so receivers
    | can migrate without downtime. `replay_window_seconds` is the maximum
    | age a receiver accepts before rejecting on timestamp skew.
    */
    'signing' => [
        'algorithm'              => 'sha256',
        'rotation_grace_seconds' => env('WEBHOOK_ROTATION_GRACE_SECONDS', 86400),
        'replay_window_seconds'  => env('WEBHOOK_REPLAY_WINDOW_SECONDS', 300),
        'secret_bytes'           => env('WEBHOOK_SECRET_BYTES', 32),
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-disable
    |--------------------------------------------------------------------------
    |
    | Subscriptions auto-disable when consecutive_failures reaches
    | `failure_threshold` OR when the receiver returns HTTP 410 Gone.
    */
    'auto_disable' => [
        'failure_threshold' => env('WEBHOOK_FAILURE_THRESHOLD', 30),
        'gone_status_code'  => 410,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate limiting
    |--------------------------------------------------------------------------
    |
    | Default per-subscription rate limit — subscriptions with a NULL
    | `rate_limit_per_minute` fall back to this value. Applied by the
    | dispatcher before actually sending.
    */
    'rate_limit' => [
        'default_per_minute' => env('WEBHOOK_RATE_LIMIT_DEFAULT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Backoff strategies
    |--------------------------------------------------------------------------
    |
    | Registered backoff strategies + their defaults. Consumers reference
    | a strategy by key on the subscription's `backoff_strategy` column.
    */
    'backoff' => [
        'default'       => env('WEBHOOK_BACKOFF_DEFAULT', 'static'),
        'static'        => [
            'seconds' => [10, 60, 300, 900, 3600],
        ],
        'retry-after-aware' => [
            'fallback_seconds' => [10, 60, 300, 900, 3600],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Destinations
    |--------------------------------------------------------------------------
    |
    | Feature flags for optional destinations. HTTPS always ships;
    | EventBridge / PubSub / mTLS default OFF in dev (require the vendor
    | SDK bindings before enabling in production).
    */
    'destinations' => [
        'default' => 'https',
        'flags'   => [
            'eventbridge' => env('WEBHOOK_DEST_EVENTBRIDGE', false),
            'pubsub'      => env('WEBHOOK_DEST_PUBSUB', false),
            'mtls'        => env('WEBHOOK_DEST_MTLS', false),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP client
    |--------------------------------------------------------------------------
    |
    | Applied by the HTTPS destination driver. Individual subscriptions
    | can override `timeout_seconds` per subscription.
    */
    'http' => [
        'timeout_seconds'          => env('WEBHOOK_HTTP_TIMEOUT', 30),
        'connect_timeout_seconds'  => env('WEBHOOK_HTTP_CONNECT_TIMEOUT', 5),
        'user_agent'               => env('WEBHOOK_HTTP_USER_AGENT', 'Stackra-Webhook/1.0'),
        'max_response_body_bytes'  => env('WEBHOOK_MAX_RESPONSE_BODY_BYTES', 65536),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | Days to retain a `webhook_deliveries` row. Rows older than this are
    | dropped by the scheduled `webhook:prune` command.
    */
    'retention' => [
        'delivery_days' => env('WEBHOOK_RETENTION_DAYS', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Health probes
    |--------------------------------------------------------------------------
    |
    | Per-subscription health probes hit `health_probe_url` on a schedule
    | and mark the subscription `unhealthy` on non-2xx.
    */
    'probe' => [
        'timeout_seconds'  => env('WEBHOOK_PROBE_TIMEOUT', 10),
        'interval_minutes' => env('WEBHOOK_PROBE_INTERVAL_MINUTES', 15),
    ],
];
