<?php

/**
 * @file modules/notifications/notifications-sms/config/notifications-sms.php
 *
 * @description
 * Runtime knobs for the `stackra/notifications-sms` module. Merged under
 * the `notifications-sms.*` key by the base ServiceProvider's LoadsResources
 * concern. Every secret reference lives in Doppler; every default value is
 * safe for local dev.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Default provider
    |--------------------------------------------------------------------------
    */
    'default' => env('NOTIFICATIONS_SMS_DEFAULT', 'twilio'),

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    */
    'providers' => [
        'twilio' => [
            'account_sid_secret_ref'  => env('TWILIO_ACCOUNT_SID'),
            'auth_token_secret_ref'   => env('TWILIO_AUTH_TOKEN'),
            'messaging_service_sid'   => env('TWILIO_MESSAGING_SERVICE_SID'),
        ],
        'messagebird' => [
            'access_key_secret_ref' => env('MESSAGEBIRD_ACCESS_KEY'),
        ],
        'vonage' => [
            'api_key_secret_ref'    => env('VONAGE_API_KEY'),
            'api_secret_secret_ref' => env('VONAGE_API_SECRET'),
        ],
        'plivo' => [
            'auth_id_secret_ref'    => env('PLIVO_AUTH_ID'),
            'auth_token_secret_ref' => env('PLIVO_AUTH_TOKEN'),
        ],
        'aws-sns' => [
            'region' => env('AWS_SNS_REGION', 'us-east-1'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Webhook signature secrets
    |--------------------------------------------------------------------------
    */
    'webhook_secrets' => [
        'twilio'      => env('NOTIFICATIONS_SMS_TWILIO_WEBHOOK_SECRET'),
        'messagebird' => env('NOTIFICATIONS_SMS_MESSAGEBIRD_WEBHOOK_SECRET'),
        'vonage'      => env('NOTIFICATIONS_SMS_VONAGE_WEBHOOK_SECRET'),
        'plivo'       => env('NOTIFICATIONS_SMS_PLIVO_WEBHOOK_SECRET'),
        'aws-sns'     => env('NOTIFICATIONS_SMS_AWS_SNS_TOPIC_ARN'),
    ],

    /*
    |--------------------------------------------------------------------------
    | STOP / START / HELP keywords
    |--------------------------------------------------------------------------
    |
    | Case-insensitive. Matched against the FIRST word of the inbound message
    | body by IngestSmsProviderWebhookJob.
    */
    'keywords' => [
        'stop'  => ['STOP', 'STOPALL', 'END', 'QUIT', 'CANCEL', 'UNSUBSCRIBE'],
        'start' => ['START', 'SUBSCRIBE', 'UNSTOP', 'YES'],
        'help'  => ['HELP', 'INFO'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cost tracking
    |--------------------------------------------------------------------------
    */
    'cost' => [
        'currency'                        => env('NOTIFICATIONS_SMS_COST_CURRENCY', 'USD'),
        'per_country_cache_ttl_seconds'   => (int) env('NOTIFICATIONS_SMS_COST_PER_COUNTRY_CACHE_TTL', 3600),
        'cap_warning_threshold_ratio'     => (float) env('NOTIFICATIONS_SMS_COST_CAP_WARN_RATIO', 0.8),
    ],

    /*
    |--------------------------------------------------------------------------
    | Segments
    |--------------------------------------------------------------------------
    */
    'segments' => [
        'gsm7_chars_per_segment'       => (int) env('NOTIFICATIONS_SMS_GSM7_CHARS', 160),
        'gsm7_multi_chars_per_segment' => (int) env('NOTIFICATIONS_SMS_GSM7_MULTI_CHARS', 153),
        'ucs2_chars_per_segment'       => (int) env('NOTIFICATIONS_SMS_UCS2_CHARS', 70),
        'ucs2_multi_chars_per_segment' => (int) env('NOTIFICATIONS_SMS_UCS2_MULTI_CHARS', 67),
        'max_segments_per_message'     => (int) env('NOTIFICATIONS_SMS_MAX_SEGMENTS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-reply templates
    |--------------------------------------------------------------------------
    */
    'auto_reply' => [
        'opt_out_confirmation'   => env(
            'NOTIFICATIONS_SMS_AUTO_REPLY_OPT_OUT',
            'You have been unsubscribed. No more messages will be sent. Reply START to re-subscribe.',
        ),
        'subscribe_confirmation' => env(
            'NOTIFICATIONS_SMS_AUTO_REPLY_SUBSCRIBE',
            'You are re-subscribed to messages from {{ tenant_name }}.',
        ),
        'help' => env(
            'NOTIFICATIONS_SMS_AUTO_REPLY_HELP',
            'Reply STOP to unsubscribe. Msg + data rates may apply.',
        ),
    ],
];
