<?php

/**
 * @file apps/laravel-template/config/services.php
 *
 * @description
 * Third-party service credentials for the Stackra API.
 *
 * Every entry reads via `env()` at config-cache time — no
 * runtime `env()` calls per `.kiro/steering/octane-first-di.md`.
 * Real values come from Doppler per `.kiro/steering/doppler.md`.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | AWS SES — email transport (production)
    |--------------------------------------------------------------------------
    */
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Slack — outbound webhook for admin notifications
    |--------------------------------------------------------------------------
    */
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
