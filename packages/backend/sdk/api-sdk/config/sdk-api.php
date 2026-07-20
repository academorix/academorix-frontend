<?php

/**
 * @file packages/sdk/api-sdk/config/sdk-api.php
 *
 * @description
 * Runtime configuration for `academorix/api-sdk`. Every value is
 * env-driven so containers, CI, and per-tenant deployments can
 * override without editing config files.
 *
 * The config namespace is `sdk.api.*` — flat under `sdk` so
 * future SDKs (`sdk.ai-service.*`, `sdk.notifications.*`) fall
 * into the same top-level bag. That keeps `config('sdk')`
 * enumerable for diagnostic dashboards.
 */

declare(strict_types=1);

use Academorix\ApiSdk\Enums\AuthStrategy;
use Academorix\ApiSdk\Enums\LogLevel;

return [

    /*
    |----------------------------------------------------------------
    | Base URL
    |----------------------------------------------------------------
    |
    | Fully-qualified URL of the `apps/api` HTTP surface. MUST
    | include the scheme + host + optional path prefix; the SDK
    | appends every Request's `resolveEndpoint()` to this base.
    |
    | Local dev:  http://api.academorix.test
    | Production: https://api.academorix.com
    |
    */
    'base_url' => env('SDK_API_BASE_URL', 'http://api.academorix.test'),

    /*
    |----------------------------------------------------------------
    | Authentication
    |----------------------------------------------------------------
    |
    | The `strategy` selects the authenticator applied on every
    | request. Bearer is the default — a Sanctum personal-access
    | token issued by `apps/api` under the `sdk` ability.
    |
    | For service-to-service auth (ai-service → api) prefer a
    | long-lived token with a `sdk:*` ability restricted by
    | Sanctum policy.
    |
    */
    'auth' => [
        'strategy' => env('SDK_API_AUTH_STRATEGY', AuthStrategy::Bearer->value),
        'token'    => env('SDK_API_TOKEN'),
        'header'   => env('SDK_API_KEY_HEADER', 'X-API-Key'),
    ],

    /*
    |----------------------------------------------------------------
    | Timeouts
    |----------------------------------------------------------------
    |
    | `connect_timeout` guards the TCP handshake; `timeout` guards
    | the full request round-trip. Both are in seconds.
    |
    | For high-throughput background jobs consider raising both;
    | for user-facing HTTP paths keep them low to avoid cascading
    | slowness when `apps/api` is under load.
    |
    */
    'timeouts' => [
        'connect' => (float) env('SDK_API_TIMEOUT_CONNECT', 3.0),
        'request' => (float) env('SDK_API_TIMEOUT_REQUEST', 10.0),
    ],

    /*
    |----------------------------------------------------------------
    | Retry policy
    |----------------------------------------------------------------
    |
    | Applied by RetryOnServerErrorMiddleware. Retries only for
    | 5xx responses and network errors — never for 4xx (client
    | errors are the caller's problem, not a transient issue).
    |
    | Backoff is exponential with jitter: base * 2^attempt +
    | random(0, base). `max_attempts` caps the retry count
    | including the initial attempt (so `3` = try once then retry
    | twice).
    |
    */
    'retry' => [
        'enabled'          => (bool) env('SDK_API_RETRY_ENABLED', true),
        'max_attempts'     => (int) env('SDK_API_RETRY_MAX_ATTEMPTS', 3),
        'base_delay_ms'    => (int) env('SDK_API_RETRY_BASE_DELAY_MS', 200),
        'max_delay_ms'     => (int) env('SDK_API_RETRY_MAX_DELAY_MS', 5_000),
        'respect_retry_after' => (bool) env('SDK_API_RETRY_RESPECT_RETRY_AFTER', true),
    ],

    /*
    |----------------------------------------------------------------
    | Correlation-id propagation
    |----------------------------------------------------------------
    |
    | When enabled, the SDK adds the current request's
    | correlation id (read from `Academorix\Foundation\Support\CorrelationId`)
    | as a header on every outbound SDK call. `apps/api` echoes
    | it back so logs across services align.
    |
    */
    'correlation_id' => [
        'enabled' => (bool) env('SDK_API_CORRELATION_ID_ENABLED', true),
        'header'  => env('SDK_API_CORRELATION_ID_HEADER', 'X-Correlation-ID'),
    ],

    /*
    |----------------------------------------------------------------
    | Logging
    |----------------------------------------------------------------
    |
    | `off`    — never log outbound calls (default for production).
    | `errors` — only log 4xx/5xx responses and network failures.
    | `all`    — log every request + response (redacted). Use for
    |            debugging; never enable in production without
    |            confirming the redaction rules cover PII.
    |
    | The redact list is a `list<string>` of case-insensitive
    | header + body-key names replaced with `REDACTED` before
    | the log line is emitted.
    |
    */
    'logging' => [
        'level'   => env('SDK_API_LOG_LEVEL', LogLevel::Errors->value),
        'channel' => env('SDK_API_LOG_CHANNEL'),
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
    | Default headers
    |----------------------------------------------------------------
    |
    | Merged into every outbound request. Useful for stamping the
    | client name / version so `apps/api` can route traffic based
    | on the caller.
    |
    */
    'headers' => [
        'Accept'       => 'application/json',
        'Content-Type' => 'application/json',
        'User-Agent'   => env('SDK_API_USER_AGENT', 'academorix-api-sdk/1.0'),
    ],

    /*
    |----------------------------------------------------------------
    | Resource discovery
    |----------------------------------------------------------------
    |
    | Master switch for the boot-time `#[AsSdkResource]` discovery
    | pass. Disable in a specific worker (e.g. queue container that
    | never talks to `apps/api`) to shave a few ms off boot.
    |
    */
    'discovery' => [
        'enabled' => (bool) env('SDK_API_DISCOVERY_ENABLED', true),
    ],

    /*
    |----------------------------------------------------------------
    | Faking
    |----------------------------------------------------------------
    |
    | When `true`, the container binds `ApiClient` to
    | `Academorix\ApiSdk\Testing\ApiFake`. Test suites toggle this
    | via `config(['sdk.api.fake' => true])` or by calling the
    | fake facade — every real HTTP dispatch is intercepted.
    |
    */
    'fake' => (bool) env('SDK_API_FAKE', false),

];
