<?php

/**
 * @file config/access-sdk.php
 *
 * @description
 * Runtime configuration for `stackra/access-sdk`. Mirrors the shape of
 * the kernel's `sdk.api.*` bag but under the `sdk.access.*` namespace, so
 * `config('sdk')` stays enumerable across every per-service SDK. Every value
 * is env-driven (`SDK_ACCESS_*`).
 */

declare(strict_types=1);

use Stackra\ApiSdk\Enums\AuthStrategy;
use Stackra\ApiSdk\Enums\LogLevel;

return [

    /*
    |----------------------------------------------------------------
    | Base URL — the Access service HTTP surface.
    |----------------------------------------------------------------
    */
    'base_url' => env('SDK_ACCESS_BASE_URL', 'https://access.stackra.test'),

    /*
    |----------------------------------------------------------------
    | Authentication — Bearer (Sanctum PAT) by default.
    |----------------------------------------------------------------
    */
    'auth' => [
        'strategy' => env('SDK_ACCESS_AUTH_STRATEGY', AuthStrategy::Bearer->value),
        'token'    => env('SDK_ACCESS_TOKEN'),
        'header'   => env('SDK_ACCESS_KEY_HEADER', 'X-API-Key'),
    ],

    /*
    |----------------------------------------------------------------
    | Timeouts (seconds).
    |----------------------------------------------------------------
    */
    'timeouts' => [
        'connect' => (float) env('SDK_ACCESS_TIMEOUT_CONNECT', 3.0),
        'request' => (float) env('SDK_ACCESS_TIMEOUT_REQUEST', 10.0),
    ],

    /*
    |----------------------------------------------------------------
    | Retry policy — 5xx + network errors only, exponential backoff.
    |----------------------------------------------------------------
    */
    'retry' => [
        'enabled'             => (bool) env('SDK_ACCESS_RETRY_ENABLED', true),
        'max_attempts'        => (int) env('SDK_ACCESS_RETRY_MAX_ATTEMPTS', 3),
        'base_delay_ms'       => (int) env('SDK_ACCESS_RETRY_BASE_DELAY_MS', 200),
        'max_delay_ms'        => (int) env('SDK_ACCESS_RETRY_MAX_DELAY_MS', 5_000),
        'respect_retry_after' => (bool) env('SDK_ACCESS_RETRY_RESPECT_RETRY_AFTER', true),
    ],

    /*
    |----------------------------------------------------------------
    | Correlation-id propagation.
    |----------------------------------------------------------------
    */
    'correlation_id' => [
        'enabled' => (bool) env('SDK_ACCESS_CORRELATION_ID_ENABLED', true),
        'header'  => env('SDK_ACCESS_CORRELATION_ID_HEADER', 'X-Correlation-ID'),
    ],

    /*
    |----------------------------------------------------------------
    | Logging — off | errors | all.
    |----------------------------------------------------------------
    */
    'logging' => [
        'level'   => env('SDK_ACCESS_LOG_LEVEL', LogLevel::Errors->value),
        'channel' => env('SDK_ACCESS_LOG_CHANNEL'),
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
        'User-Agent'   => env('SDK_ACCESS_USER_AGENT', 'stackra-access-sdk/1.0'),
    ],

    /*
    |----------------------------------------------------------------
    | Resource discovery + faking.
    |----------------------------------------------------------------
    */
    'discovery' => [
        'enabled' => (bool) env('SDK_ACCESS_DISCOVERY_ENABLED', true),
    ],

    'fake' => (bool) env('SDK_ACCESS_FAKE', false),

];
