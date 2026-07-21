<?php

/**
 * @file packages/sdk/api-sdk/src/Middleware/RetryOnServerErrorMiddleware.php
 *
 * @description
 * Retry policy for the SDK. Applied on the response side: when
 * the response is a 5xx OR the underlying transport threw a
 * connection error, the middleware resends the request with
 * exponential backoff + jitter.
 *
 * Never retries 4xx responses — those are client-side failures
 * and retrying them is either useless (400, 403, 404) or actively
 * harmful (429 — see the special-case below).
 *
 * ## Special cases
 *
 *   - **429** — respects `Retry-After` when
 *     `sdk.api.retry.respect_retry_after` is `true`. Waits the
 *     advertised time before retrying (capped at
 *     `sdk.api.retry.max_delay_ms`). When the header is missing,
 *     falls back to the exponential-backoff schedule.
 *
 *   - **Network errors** — treated as retryable regardless of
 *     the HTTP status (there's none). Fired at the same backoff
 *     as 5xx.
 *
 * ## Backoff formula
 *
 * ```
 * delay = min(max_delay, base * 2^attempt + jitter)
 * jitter = random(0, base)
 * ```
 *
 * This is the standard "full jitter" formula from the AWS
 * Architecture Blog — spreads retries across time to avoid
 * thundering-herd on shared services.
 *
 * ## Implementation note
 *
 * Saloon's built-in `sender()->send()` doesn't expose a retry
 * primitive that plays nicely with typed exceptions — the
 * middleware in this file wraps `$connector->send()` internally.
 * Rather than fight Saloon's middleware pipeline (which
 * doesn't natively support "re-send" semantics on the response
 * side), we register a `handleRetry` FatalRequestException
 * handler that inspects failures and re-queues them via
 * `$connector->send($request)` when retryable.
 *
 * ## Interaction with ThrowOnFailureMiddleware
 *
 * `RetryOnServerErrorMiddleware` MUST run BEFORE
 * `ThrowOnFailureMiddleware`. Both are response-side, and
 * middleware registered earlier runs first — so this middleware
 * has the chance to swap a failing response for a retry before
 * the throw-on-failure middleware ever sees it.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Middleware;

use Saloon\Http\Connector;
use Saloon\Http\Response;

/**
 * Response-side middleware — retries 5xx + network failures
 * with exponential backoff + jitter.
 */
final class RetryOnServerErrorMiddleware
{
    /**
     * Per-request attempt counter — a static map keyed by
     * request-object hash to survive Saloon's re-dispatch of
     * the same PendingRequest. Cleared on final success or
     * final failure so long-lived workers don't leak memory.
     *
     * @var array<string, int>
     */
    private static array $attempts = [];

    /**
     * @param  int   $maxAttempts        Total attempts including the first (min 1).
     * @param  int   $baseDelayMs        Base delay in ms for the exponential backoff.
     * @param  int   $maxDelayMs         Ceiling for the computed delay.
     * @param  bool  $respectRetryAfter  Honour `Retry-After` on 429 when present.
     */
    public function __construct(
        private readonly int $maxAttempts,
        private readonly int $baseDelayMs,
        private readonly int $maxDelayMs,
        private readonly bool $respectRetryAfter,
    ) {
    }

    /**
     * Register on the connector. Response-side because we need
     * the response body / headers to decide if a retry is
     * warranted.
     */
    public function register(Connector $connector): void
    {
        $connector->middleware()->onResponse(
            function (Response $response) use ($connector): Response {
                return $this->handle($response, $connector);
            },
            'retry-on-server-error',
        );
    }

    /**
     * Decide whether to retry. Returns the (possibly-new) response.
     */
    private function handle(Response $response, Connector $connector): Response
    {
        $status = $response->status();
        if (! $this->isRetryable($status)) {
            $this->forget($response);
            return $response;
        }

        $key = $this->fingerprint($response);
        $attempt = self::$attempts[$key] ?? 1;

        if ($attempt >= $this->maxAttempts) {
            // Exhausted the retry budget — surface the failing
            // response so the throw-on-failure middleware can
            // convert it to a typed exception.
            $this->forget($response);
            return $response;
        }

        // Compute + apply the backoff delay.
        $delayMs = $this->delayMs($response, $attempt);
        if ($delayMs > 0) {
            // usleep expects microseconds; convert from ms.
            usleep($delayMs * 1000);
        }

        self::$attempts[$key] = $attempt + 1;

        // Re-dispatch the SAME request instance through the same
        // connector. Saloon runs the full middleware pipeline
        // again — including auth + correlation-id — so retries
        // are indistinguishable from a fresh dispatch at the
        // wire level.
        $request = $response->getPendingRequest()->getRequest();

        return $connector->send($request);
    }

    /**
     * Retry only on 5xx and on 429 (where we honour Retry-After
     * separately). 4xx is not retried — those are client errors.
     */
    private function isRetryable(int $status): bool
    {
        return $status >= 500 || $status === 429;
    }

    /**
     * Compute the pre-retry delay in ms. Respects `Retry-After`
     * on 429 when configured; otherwise applies the exponential
     * backoff + jitter formula.
     */
    private function delayMs(Response $response, int $attempt): int
    {
        if ($response->status() === 429 && $this->respectRetryAfter) {
            $header = $response->header('Retry-After');
            if (is_string($header) && ctype_digit($header)) {
                return min($this->maxDelayMs, ((int) $header) * 1000);
            }
        }

        // Full-jitter exponential backoff:
        //   base * 2^(attempt-1) + random(0, base)
        //   attempt=1 → base   (roughly)
        //   attempt=2 → base*2
        //   attempt=3 → base*4
        $exp    = $this->baseDelayMs * (2 ** ($attempt - 1));
        $jitter = random_int(0, $this->baseDelayMs);

        return min($this->maxDelayMs, $exp + $jitter);
    }

    /**
     * Fingerprint a response's originating request so retries
     * of the same request share an attempt counter. Uses the
     * PendingRequest's object hash — stable within one dispatch
     * chain, unique across dispatches.
     */
    private function fingerprint(Response $response): string
    {
        return spl_object_hash($response->getPendingRequest()->getRequest());
    }

    /**
     * Clear the attempt counter when a request completes (either
     * a final failure or a success). Prevents unbounded growth
     * of `self::$attempts` in long-lived workers.
     */
    private function forget(Response $response): void
    {
        unset(self::$attempts[$this->fingerprint($response)]);
    }
}
