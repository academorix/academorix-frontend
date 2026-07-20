<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/RateLimitException.php
 *
 * @description
 * Thrown on HTTP 429 responses. Carries the `Retry-After` header
 * value (in seconds) so callers can pause + retry when
 * appropriate.
 *
 * ## Retry semantics
 *
 * The SDK's built-in retry middleware honours `Retry-After` for
 * 429 responses when `sdk.api.retry.respect_retry_after` is
 * `true` (the default). Consumers that DISABLE the middleware
 * still get this exception + `retryAfterSeconds()` to implement
 * their own backoff.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Exceptions;

use Saloon\Http\Request;
use Saloon\Http\Response;
use Throwable;

/**
 * HTTP 429 — the API refused the request due to rate limiting.
 */
final class RateLimitException extends ApiRequestException
{
    /**
     * @param  string          $message
     * @param  int             $retryAfterSeconds  Seconds to wait before retrying; 0 when the API didn't send `Retry-After`.
     * @param  Request|null    $request
     * @param  Response|null   $response
     * @param  Throwable|null  $previous
     */
    public function __construct(
        string $message,
        private readonly int $retryAfterSeconds = 0,
        ?Request $request = null,
        ?Response $response = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 429, $request, $response, $previous);
    }

    /**
     * Seconds to wait before retrying, as advertised by the
     * `Retry-After` response header. Returns `0` when the API
     * didn't advertise a specific wait.
     */
    public function retryAfterSeconds(): int
    {
        return $this->retryAfterSeconds;
    }

    /**
     * {@inheritDoc}
     *
     * @return array<string, mixed>
     */
    public function context(): array
    {
        return parent::context() + [
            'sdk.retry_after_seconds' => $this->retryAfterSeconds,
        ];
    }
}
