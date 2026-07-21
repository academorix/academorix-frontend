<?php

/**
 * @file packages/sdk/api-sdk/src/Client/ApiConnector.php
 *
 * @description
 * Saloon connector for the `apps/api` HTTP surface. Every
 * outbound SDK call flows through this single connector so
 * base-URL configuration, auth headers, timeouts, retry
 * behaviour, correlation-id propagation, and typed-exception
 * translation are all applied uniformly.
 *
 * ## Saloon v3 pattern
 *
 * The connector extends `Saloon\Http\Connector` and provides:
 *
 *   - {@see resolveBaseUrl()} — the base URL every request is
 *     appended to.
 *   - {@see defaultHeaders()} — merged into every request.
 *   - {@see defaultConfig()}  — passed through to the underlying
 *     Guzzle sender (timeout + connect_timeout).
 *   - `middleware()->onRequest(...)` and `->onResponse(...)`
 *     hooks wired in `bootMiddleware()` (called from the
 *     constructor after configuration is captured).
 *
 * The `Authenticator` is applied via `$this->authenticate(...)`
 * — the choice of authenticator depends on the configured
 * `AuthStrategy`.
 *
 * @see \Stackra\ApiSdk\Middleware\CorrelationIdMiddleware
 * @see \Stackra\ApiSdk\Middleware\ThrowOnFailureMiddleware
 * @see \Stackra\ApiSdk\Middleware\RetryOnServerErrorMiddleware
 * @see \Stackra\ApiSdk\Middleware\LogRequestMiddleware
 * @see \Stackra\ApiSdk\Authentication\ApiKeyAuthenticator
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Client;

use Stackra\ApiSdk\Authentication\ApiKeyAuthenticator;
use Stackra\ApiSdk\Enums\AuthStrategy;
use Stackra\ApiSdk\Enums\LogLevel;
use Stackra\ApiSdk\Middleware\CorrelationIdMiddleware;
use Stackra\ApiSdk\Middleware\LogRequestMiddleware;
use Stackra\ApiSdk\Middleware\RetryOnServerErrorMiddleware;
use Stackra\ApiSdk\Middleware\ThrowOnFailureMiddleware;
use Psr\Log\LoggerInterface;
use Saloon\Http\Auth\TokenAuthenticator;
use Saloon\Http\Connector;

/**
 * Saloon connector for `apps/api`. Discovered SDK resources
 * dispatch their requests through this connector.
 *
 * ## Immutable configuration
 *
 * Every construction parameter maps 1-1 to a `sdk.api.*` config
 * key; the container binds the connector as a `#[Singleton]` so
 * apps get a single shared instance. Reconfiguration at runtime
 * requires resolving a fresh instance from the container (used
 * only in tests via a scoped rebind).
 */
final class ApiConnector extends Connector
{
    /**
     * Cached base URL. Immutable per instance.
     */
    private readonly string $baseUrl;

    /**
     * Per-request timeouts, from `sdk.api.timeouts.*`.
     *
     * @var array{connect: float, request: float}
     */
    private readonly array $timeouts;

    /**
     * Default headers merged into every outbound request.
     *
     * @var array<string, string>
     */
    private readonly array $defaultHeaders;

    /**
     * @param  string                            $baseUrl        Base URL — `sdk.api.base_url`.
     * @param  AuthStrategy                      $authStrategy   Auth strategy — `sdk.api.auth.strategy`.
     * @param  string|null                       $authToken      Bearer token or API key value — `sdk.api.auth.token`.
     * @param  string                            $authHeader     API-key header name (ignored for Bearer) — `sdk.api.auth.header`.
     * @param  array{connect: float, request: float} $timeouts   Timeouts.
     * @param  array<string, string>             $defaultHeaders Merged into every request.
     * @param  bool                              $retryEnabled
     * @param  int                               $retryMaxAttempts
     * @param  int                               $retryBaseDelayMs
     * @param  int                               $retryMaxDelayMs
     * @param  bool                              $retryRespectRetryAfter
     * @param  bool                              $correlationIdEnabled
     * @param  string                            $correlationIdHeader
     * @param  LogLevel                          $logLevel
     * @param  list<string>                      $logRedact
     * @param  LoggerInterface|null              $logger         When null, LogRequestMiddleware is a no-op.
     */
    public function __construct(
        string $baseUrl,
        AuthStrategy $authStrategy,
        ?string $authToken,
        string $authHeader,
        array $timeouts,
        array $defaultHeaders,
        bool $retryEnabled,
        int $retryMaxAttempts,
        int $retryBaseDelayMs,
        int $retryMaxDelayMs,
        bool $retryRespectRetryAfter,
        bool $correlationIdEnabled,
        string $correlationIdHeader,
        LogLevel $logLevel,
        array $logRedact,
        ?LoggerInterface $logger = null,
    ) {
        $this->baseUrl        = rtrim($baseUrl, '/');
        $this->timeouts       = $timeouts;
        $this->defaultHeaders = $defaultHeaders;

        // ------------------------------------------------------------
        // Authentication.
        // ------------------------------------------------------------
        // Saloon expects the authenticator to be applied to the
        // connector once — every outgoing request inherits it.
        // For `AuthStrategy::None` (health probes, bootstrap)
        // we skip the call entirely.
        $this->applyAuthenticator($authStrategy, $authToken, $authHeader);

        // ------------------------------------------------------------
        // Middleware pipeline.
        // ------------------------------------------------------------
        // Order matters. Correlation-id is injected FIRST so it
        // stamps every retry too. Throw-on-failure runs LAST on
        // the response side so the retry middleware still sees
        // the raw response and can decide whether to retry.
        if ($correlationIdEnabled) {
            $this->middleware()->onRequest(
                new CorrelationIdMiddleware($correlationIdHeader),
                'correlation-id',
            );
        }

        if ($retryEnabled) {
            (new RetryOnServerErrorMiddleware(
                maxAttempts: $retryMaxAttempts,
                baseDelayMs: $retryBaseDelayMs,
                maxDelayMs: $retryMaxDelayMs,
                respectRetryAfter: $retryRespectRetryAfter,
            ))->register($this);
        }

        if ($logger !== null && $logLevel !== LogLevel::Off) {
            (new LogRequestMiddleware(
                logger: $logger,
                level: $logLevel,
                redact: $logRedact,
            ))->register($this);
        }

        // Throw-on-failure LAST — every other response-side hook
        // must see the raw Response first.
        (new ThrowOnFailureMiddleware())->register($this);
    }

    /**
     * The base URL every request is appended to. Saloon calls
     * this once per request to resolve the full endpoint URL.
     */
    public function resolveBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Default headers merged into every request. Consumers can
     * still override on a per-request basis via `defaultHeaders()`
     * on the Request subclass.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->defaultHeaders;
    }

    /**
     * Passed through to Guzzle for every request. Timeouts are
     * the only knob we care about; retry behaviour is handled by
     * our own middleware (not Guzzle's `retry` option).
     *
     * @return array<string, mixed>
     */
    protected function defaultConfig(): array
    {
        return [
            'connect_timeout' => $this->timeouts['connect'],
            'timeout'         => $this->timeouts['request'],
        ];
    }

    /**
     * Choose + apply the Saloon authenticator matching the
     * configured strategy. `AuthStrategy::None` intentionally
     * doesn't call `$this->authenticate()` — the outbound
     * request has no auth header.
     */
    private function applyAuthenticator(
        AuthStrategy $strategy,
        ?string $token,
        string $apiKeyHeader,
    ): void {
        match ($strategy) {
            AuthStrategy::Bearer => $token !== null && $token !== ''
                ? $this->authenticate(new TokenAuthenticator($token))
                : null,
            AuthStrategy::ApiKey => $token !== null && $token !== ''
                ? $this->authenticate(new ApiKeyAuthenticator($apiKeyHeader, $token))
                : null,
            AuthStrategy::None => null,
        };
    }
}
