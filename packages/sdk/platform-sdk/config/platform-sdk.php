<?php

/**
 * @file config/platform-sdk.php
 *
 * @description
 * Runtime configuration for `stackra/platform-sdk`. Mirrors the shape of
 * the kernel's `sdk.api.*` bag but under the `sdk.platform.*` namespace, so
 * `config('sdk')` stays enumerable across every per-service SDK. Every value
 * is env-driven (`SDK_PLATFORM_*`).
 */

declare(strict_types=1);

use Stackra\ApiSdk\Enums\AuthStrategy;
use Stackra\ApiSdk\Enums\LogLevel;

return [

    /*
    |----------------------------------------------------------------
    | Base URL — the Platform service HTTP surface.
    |----------------------------------------------------------------
    */
    'base_url' => env('SDK_PLATFORM_BASE_URL', 'https://platform.stackra.test'),

    /*
    |----------------------------------------------------------------
    | Authentication — Bearer (Sanctum PAT) by default.
    |----------------------------------------------------------------
    */
    'auth' => [
        'strategy' => env('SDK_PLATFORM_AUTH_STRATEGY', AuthStrategy::Bearer->value),
        'token'    => env('SDK_PLATFORM_TOKEN'),
        'header'   => env('SDK_PLATFORM_KEY_HEADER', 'X-API-Key'),
    ],

    /*
    |----------------------------------------------------------------
    | Timeouts (seconds).
    |----------------------------------------------------------------
    */
    'timeouts' => [
        'connect' => (float) env('SDK_PLATFORM_TIMEOUT_CONNECT', 3.0),
        'request' => (float) env('SDK_PLATFORM_TIMEOUT_REQUEST', 10.0),
    ],

    /*
    |----------------------------------------------------------------
    | Retry policy — 5xx + network errors only, exponential backoff.
    |----------------------------------------------------------------
    */
    'retry' => [
        'enabled'             => (bool) env('SDK_PLATFORM_RETRY_ENABLED', true),
        'max_attempts'        => (int) env('SDK_PLATFORM_RETRY_MAX_ATTEMPTS', 3),
        'base_delay_ms'       => (int) env('SDK_PLATFORM_RETRY_BASE_DELAY_MS', 200),
        'max_delay_ms'        => (int) env('SDK_PLATFORM_RETRY_MAX_DELAY_MS', 5_000),
        'respect_retry_after' => (bool) env('SDK_PLATFORM_RETRY_RESPECT_RETRY_AFTER', true),
    ],

    /*
    |----------------------------------------------------------------
    | Correlation-id propagation.
    |----------------------------------------------------------------
    */
    'correlation_id' => [
        'enabled' => (bool) env('SDK_PLATFORM_CORRELATION_ID_ENABLED', true),
        'header'  => env('SDK_PLATFORM_CORRELATION_ID_HEADER', 'X-Correlation-ID'),
    ],

    /*
    |----------------------------------------------------------------
    | Logging — off | errors | all.
    |----------------------------------------------------------------
    */
    'logging' => [
        'level'   => env('SDK_PLATFORM_LOG_LEVEL', LogLevel::Errors->value),
        'channel' => env('SDK_PLATFORM_LOG_CHANNEL'),
        'redact'  => [
            'authorization',
            'x-api-key',
            'cookie',
            'set-cookie',
            'password',
            'password_confirmation',
            'token',
            'access_token',
            'refresh_token',
            'client_secret',
        ],
    ],

    /*
    |----------------------------------------------------------------
    | Default headers merged into every outbound request.
    |----------------------------------------------------------------
    */
    'headers' => [
        'Accept'       => 'application/json',
        'Content-Type' => 'application/json',
        'User-Agent'   => env('SDK_PLATFORM_USER_AGENT', 'stackra-platform-sdk/1.0'),
    ],

    /*
    |----------------------------------------------------------------
    | Resource discovery + faking.
    |----------------------------------------------------------------
    */
    'discovery' => [
        'enabled' => (bool) env('SDK_PLATFORM_DISCOVERY_ENABLED', true),
    ],

    'fake' => (bool) env('SDK_PLATFORM_FAKE', false),

];
