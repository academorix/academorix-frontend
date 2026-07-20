<?php

/**
 * @file packages/sdk/api-sdk/src/Middleware/ThrowOnFailureMiddleware.php
 *
 * @description
 * Response-side middleware that converts every non-2xx response
 * into a typed `ApiRequestException` subclass. Consumers catch
 * specific exceptions (`ValidationException`, `RateLimitException`,
 * `AuthenticationException`, …) or the base class for anything.
 *
 * ## Ordering
 *
 * MUST be the LAST response-side middleware in the pipeline —
 * every other hook (logging, retry) needs to see the raw
 * response first. The connector's constructor takes care of
 * ordering.
 *
 * ## Payload parsing
 *
 * For 422 responses, the middleware attempts to parse Laravel's
 * conventional `errors` map into
 * {@see \Academorix\ApiSdk\Exceptions\ValidationException}. When
 * the response body isn't JSON or the shape doesn't match, it
 * falls back to a plain exception with an empty errors list.
 *
 * For 429 responses, `Retry-After` is read into
 * {@see \Academorix\ApiSdk\Exceptions\RateLimitException::retryAfterSeconds()}.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Middleware;

use Academorix\ApiSdk\Exceptions\ApiRequestException;
use Academorix\ApiSdk\Exceptions\AuthenticationException;
use Academorix\ApiSdk\Exceptions\AuthorizationException;
use Academorix\ApiSdk\Exceptions\RateLimitException;
use Academorix\ApiSdk\Exceptions\ResourceNotFoundException;
use Academorix\ApiSdk\Exceptions\ServerException;
use Academorix\ApiSdk\Exceptions\ValidationException;
use Saloon\Http\Connector;
use Saloon\Http\Response;

/**
 * Response-side middleware — throws typed exceptions on failure.
 */
final class ThrowOnFailureMiddleware
{
    /**
     * Wire this middleware onto the connector as a response
     * hook. Register once; invoked for every response.
     */
    public function register(Connector $connector): void
    {
        $connector->middleware()->onResponse(
            fn (Response $response): Response => $this->handle($response),
            'throw-on-failure',
        );
    }

    /**
     * Inspect the response; throw when the status indicates a
     * failure. Returns the response unchanged on success.
     *
     * @throws ApiRequestException When the response's HTTP status is >= 400.
     */
    private function handle(Response $response): Response
    {
        $status = $response->status();
        if ($status < 400) {
            return $response;
        }

        throw match (true) {
            $status === 401 => new AuthenticationException(
                message: $this->messageFor($response, 'Authentication failed.'),
                statusCode: $status,
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            $status === 403 => new AuthorizationException(
                message: $this->messageFor($response, 'Authorization failed.'),
                statusCode: $status,
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            $status === 404 => new ResourceNotFoundException(
                message: $this->messageFor($response, 'Resource not found.'),
                statusCode: $status,
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            $status === 422 => new ValidationException(
                message: $this->messageFor($response, 'Validation failed.'),
                errors:  $this->validationErrors($response),
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            $status === 429 => new RateLimitException(
                message: $this->messageFor($response, 'Rate limited.'),
                retryAfterSeconds: $this->retryAfterSeconds($response),
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            $status >= 500 => new ServerException(
                message: $this->messageFor($response, 'Server error.'),
                statusCode: $status,
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
            default => new ApiRequestException(
                message: $this->messageFor($response, 'API request failed.'),
                statusCode: $status,
                request: $response->getPendingRequest()->getRequest(),
                response: $response,
            ),
        };
    }

    /**
     * Extract a human-readable summary from the response body.
     * Falls back to `$fallback` when the body isn't JSON or the
     * `message` field isn't present.
     */
    private function messageFor(Response $response, string $fallback): string
    {
        try {
            $body = $response->json();
        } catch (\Throwable) {
            return $fallback;
        }

        if (is_array($body) && isset($body['message']) && is_string($body['message'])) {
            return $body['message'];
        }

        return $fallback;
    }

    /**
     * Read Laravel's conventional `errors` map out of a 422
     * response body. Returns `[]` when the shape doesn't match.
     *
     * @return array<string, list<string>>
     */
    private function validationErrors(Response $response): array
    {
        try {
            $body = $response->json();
        } catch (\Throwable) {
            return [];
        }

        if (! is_array($body) || ! isset($body['errors']) || ! is_array($body['errors'])) {
            return [];
        }

        $errors = [];
        foreach ($body['errors'] as $field => $messages) {
            if (! is_string($field) || ! is_array($messages)) {
                continue;
            }
            $errors[$field] = array_values(array_filter($messages, 'is_string'));
        }

        return $errors;
    }

    /**
     * Parse the `Retry-After` header. Supports the seconds-int
     * form (`Retry-After: 30`). HTTP-date form isn't handled —
     * `apps/api` uses seconds exclusively.
     */
    private function retryAfterSeconds(Response $response): int
    {
        $header = $response->header('Retry-After');
        if ($header === null || $header === '') {
            return 0;
        }

        return ctype_digit($header) ? (int) $header : 0;
    }
}
