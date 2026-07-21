<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/ApiRequestException.php
 *
 * @description
 * Base exception for every SDK failure mode. Carries the failing
 * request + response so consumers can inspect status codes,
 * headers, or body when reacting.
 *
 * ## Hierarchy
 *
 * ```
 *  ApiRequestException                     ← base; catch this to handle "any SDK failure"
 *  ├── AuthenticationException             ← 401
 *  ├── AuthorizationException              ← 403
 *  ├── ResourceNotFoundException           ← 404
 *  ├── ValidationException                 ← 422 (per-field errors on `->errors`)
 *  ├── RateLimitException                  ← 429 (Retry-After on `->retryAfterSeconds`)
 *  ├── ServerException                     ← 5xx (retryable via the retry middleware)
 *  └── NetworkException                    ← DNS / TCP / TLS / read-timeout — no HTTP response
 * ```
 *
 * All extend `Stackra\Exceptions\Exception` so the
 * central JSON renderer treats them uniformly and Sentry gets
 * the correct fingerprint.
 *
 * ## When to catch what
 *
 *   - Domain code catches specific subclasses
 *     (`ResourceNotFoundException`, `ValidationException`) and
 *     translates to a domain-specific decision.
 *
 *   - Cross-cutting code (retry policies, dead-letter routing)
 *     catches the base class.
 *
 *   - The auth authenticator handles `AuthenticationException`
 *     internally to trigger a token refresh + one retry.
 *
 * ## Context payload
 *
 * `context()` returns a redacted map suitable for logs / Sentry
 * breadcrumbs: request method + endpoint, response status +
 * headers (with the SDK's redact list applied). NEVER include
 * the response body verbatim — parse it into `errors()` when
 * relevant instead.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Exceptions;

use Stackra\Exceptions\Exception;
use Saloon\Http\Request;
use Saloon\Http\Response;
use Throwable;

/**
 * Base for every SDK failure. Subclasses narrow the semantics by
 * HTTP status; consumers catch the specific subclass they care
 * about and let others bubble.
 */
class ApiRequestException extends Exception
{
    /**
     * @param  string          $message   Human-readable failure summary.
     * @param  int             $statusCode HTTP status; 0 for network-level failures.
     * @param  Request|null    $request   The failing Saloon request, when available.
     * @param  Response|null   $response  The Saloon response, when the failure was HTTP-level.
     * @param  Throwable|null  $previous  Underlying transport / decode error.
     */
    public function __construct(
        string $message,
        protected readonly int $statusCode = 0,
        protected readonly ?Request $request = null,
        protected readonly ?Response $response = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $statusCode, $previous);
    }

    /**
     * The HTTP status code that triggered this exception. `0`
     * indicates a network-level failure (no response received).
     */
    public function statusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * The Saloon request that failed. `null` when the failure
     * happened before Saloon built one.
     */
    public function request(): ?Request
    {
        return $this->request;
    }

    /**
     * The Saloon response, when the failure was HTTP-level.
     * `null` for network / timeout / decode errors.
     */
    public function response(): ?Response
    {
        return $this->response;
    }

    /**
     * Redacted structural context for logs and Sentry. Never
     * includes the response body verbatim; subclasses that parse
     * a structured error payload expose it via their own
     * accessor.
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return [
            'sdk.status'   => $this->statusCode,
            'sdk.method'   => $this->request?->getMethod()->value,
            'sdk.endpoint' => $this->request?->resolveEndpoint(),
        ];
    }
}
