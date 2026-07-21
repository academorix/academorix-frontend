<?php

/**
 * @file config/billing-sdk.php
 *
 * @description
 * Runtime configuration for `stackra/billing-sdk`. Mirrors the shape of
 * the kernel's `sdk.api.*` bag but under the `sdk.billing.*` namespace, so
 * `config('sdk')` stays enumerable across every per-service SDK. Every value
 * is env-driven (`SDK_BILLING_*`).
 */

declare(strict_types=1);

use Stackra\ApiSdk\Enums\AuthStrategy;
use Stackra\ApiSdk\Enums\LogLevel;

return [

    /*
    |----------------------------------------------------------------
    | Base URL — the Billing service HTTP surface.
    |----------------------------------------------------------------
    */
    'base_url' => env('SDK_BILLING_BASE_URL', 'https://billing.stackra.test'),

    /*
    |----------------------------------------------------------------
    | Authentication — Bearer (Sanctum PAT) by default.
    |----------------------------------------------------------------
    */
    'auth' => [
        'strategy' => env('SDK_BILLING_AUTH_STRATEGY', AuthStrategy::Bearer->value),
        'token'    => env('SDK_BILLING_TOKEN'),
        'header'   => env('SDK_BILLING_KEY_HEADER', 'X-API-Key'),
    ],

    /*
    |----------------------------------------------------------------
    | Timeouts (seconds).
    |----------------------------------------------------------------
    */
    'timeouts' => [
        'connect' => (float) env('SDK_BILLING_TIMEOUT_CONNECT', 3.0),
        'request' => (float) env('SDK_BILLING_TIMEOUT_REQUEST', 10.0),
    ],

    /*
    |----------------------------------------------------------------
    | Retry policy — 5xx + network errors only, exponential backoff.
    |----------------------------------------------------------------
    */
    'retry' => [
        'enabled'             => (bool) env('SDK_BILLING_RETRY_ENABLED', true),
        'max_attempts'        => (int) env('SDK_BILLING_RETRY_MAX_ATTEMPTS', 3),
        'base_delay_ms'       => (int) env('SDK_BILLING_RETRY_BASE_DELAY_MS', 200),
        'max_delay_ms'        => (int) env('SDK_BILLING_RETRY_MAX_DELAY_MS', 5_000),
        'respect_retry_after' => (bool) env('SDK_BILLING_RETRY_RESPECT_RETRY_AFTER', true),
    ],

    /*
    |----------------------------------------------------------------
    | Correlation-id propagation.
    |----------------------------------------------------------------
    */
    'correlation_id' => [
        'enabled' => (bool) env('SDK_BILLING_CORRELATION_ID_ENABLED', true),
        'header'  => env('SDK_BILLING_CORRELATION_ID_HEADER', 'X-Correlation-ID'),
    ],

    /*
    |----------------------------------------------------------------
    | Logging — off | errors | all.
    |----------------------------------------------------------------
    */
    'logging' => [
        'level'   => env('SDK_BILLING_LOG_LEVEL', LogLevel::Errors->value),
        'channel' => env('SDK_BILLING_LOG_CHANNEL'),
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
        'User-Agent'   => env('SDK_BILLING_USER_AGENT', 'stackra-billing-sdk/1.0'),
    ],

    /*
    |----------------------------------------------------------------
    | Resource discovery + faking.
    |----------------------------------------------------------------
    */
    'discovery' => [
        'enabled' => (bool) env('SDK_BILLING_DISCOVERY_ENABLED', true),
    ],

    'fake' => (bool) env('SDK_BILLING_FAKE', false),

];
