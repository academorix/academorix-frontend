<?php

/**
 * @file modules/notifications/notifications-mail/config/notifications-mail.php
 *
 * @description
 * Runtime knobs for the `academorix/notifications-mail` module.
 * Merged under the `notifications-mail.*` key by the base
 * ServiceProvider's LoadsResources concern. Downstream code reads
 * via `config('notifications-mail.*')` (never `env()` outside this
 * file per Octane-first rules).
 *
 * Transport definitions themselves live in Laravel's own
 * `config/mail.php` — this config owns per-category routing,
 * provider observability, and suppression cache TTLs.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Feature flag
    |--------------------------------------------------------------------------
    |
    | Master kill-switch. When disabled, the listener + observer
    | no-op without dispatching sends or persisting suppressions.
    | Useful during incident response when the log volume itself is
    | the incident.
    */
    'enabled' => (bool) env('NOTIFICATIONS_MAIL_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Default mailer
    |--------------------------------------------------------------------------
    |
    | Which of Laravel's configured mailers to use by default. Same
    | values as `config('mail.default')` accepts (`smtp`, `ses`,
    | `mailgun`, `postmark`, `resend`, `log`, `array`).
    */
    'default' => env('NOTIFICATIONS_MAIL_DEFAULT', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Channel key
    |--------------------------------------------------------------------------
    |
    | The channel identifier this driver registers with the parent's
    | NotificationChannelRegistry. Matches NotificationChannel::Mail.
    */
    'channel_key' => 'mail',

    /*
    |--------------------------------------------------------------------------
    | Per-category routing
    |--------------------------------------------------------------------------
    |
    | Overrides the default mailer per notification category. Enables
    | routing transactional through SES and marketing through
    | SendGrid without changing the default. Shape:
    |   [
    |     '<category_slug>' => [
    |       'mailer'       => 'ses',
    |       'from_address' => 'billing@example.com',
    |     ],
    |   ]
    | Populated by tenant admin surfaces at runtime; static defaults
    | live here for the deploy-wide defaults.
    */
    'categories' => [
        // 'invoice_paid' => ['mailer' => 'ses', 'from_address' => null],
    ],

    /*
    |--------------------------------------------------------------------------
    | Provider webhook signing secrets
    |--------------------------------------------------------------------------
    |
    | Every provider signs inbound webhooks differently. The middleware
    | `verify.mail-webhook` reads the appropriate secret / public key
    | per provider and rejects unsigned requests with HTTP 401.
    */
    'webhook_secrets' => [
        'mailgun' => env('MAILGUN_WEBHOOK_SIGNING_KEY'),
        'mailgun_previous' => env('MAILGUN_WEBHOOK_SIGNING_KEY_PREVIOUS'),

        'sendgrid' => env('SENDGRID_WEBHOOK_PUBLIC_KEY'),
        'sendgrid_previous' => env('SENDGRID_WEBHOOK_PUBLIC_KEY_PREVIOUS'),

        'aws-ses' => env('AWS_SES_SNS_TOPIC_ARN'),

        'postmark' => env('POSTMARK_WEBHOOK_BASIC_AUTH'),

        'resend' => env('RESEND_WEBHOOK_SIGNING_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Suppression list
    |--------------------------------------------------------------------------
    */
    'suppression' => [
        // Redis TTL for the per-tenant suppression bloom filter.
        'cache_ttl_seconds' => (int) env('NOTIFICATIONS_MAIL_SUPPRESSION_CACHE_TTL', 300),

        // Soft-bounce entries auto-expire after this many days if
        // not re-triggered.
        'soft_bounce_expiry_days' => (int) env('NOTIFICATIONS_MAIL_SOFT_BOUNCE_EXPIRY_DAYS', 7),

        // Zero — hard bounces do not retry. Kept as a config for
        // override in test env.
        'hard_bounce_max_retries' => (int) env('NOTIFICATIONS_MAIL_HARD_BOUNCE_MAX_RETRIES', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | CAN-SPAM footer + List-Unsubscribe injection
    |--------------------------------------------------------------------------
    */
    'footer' => [
        'inject_postal_address' => (bool) env('NOTIFICATIONS_MAIL_INJECT_POSTAL_ADDRESS', true),
        'inject_list_unsubscribe' => (bool) env('NOTIFICATIONS_MAIL_INJECT_LIST_UNSUBSCRIBE', true),
        // RFC 8058 one-click unsubscribe URL template. `{app_url}`
        // is substituted at send-time; `{token}` is a signed
        // per-recipient token bound to the notification id.
        'one_click_unsubscribe_url_template' => env(
            'NOTIFICATIONS_MAIL_ONE_CLICK_URL_TEMPLATE',
            '{app_url}/api/notifications/unsubscribe/{token}',
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Test-mode safety
    |--------------------------------------------------------------------------
    |
    | Local + test env defaults. Prevents accidental live sends from
    | developer machines + CI. When APP_ENV is `local` or `testing`,
    | the SendMailJob refuses recipients outside `allowed_recipient_domains`.
    */
    'test' => [
        'local_from_address' => env('NOTIFICATIONS_MAIL_LOCAL_FROM_ADDRESS', 'no-reply@localhost'),
        'allowed_recipient_domains' => [
            'example.com',
            'example.net',
            'test',
        ],
    ],
];
