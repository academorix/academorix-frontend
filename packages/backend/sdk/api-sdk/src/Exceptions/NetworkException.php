<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/NetworkException.php
 *
 * @description
 * Thrown when the request never received an HTTP response — DNS
 * lookup failure, TCP handshake failure, TLS negotiation
 * failure, or read timeout.
 *
 * These are almost always transient. The SDK's retry middleware
 * retries these by default (the retry budget is separate from
 * the one governing 5xx responses).
 *
 * `statusCode()` is always `0` for this class — there's no HTTP
 * response to derive one from.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Exceptions;

use Saloon\Http\Request;
use Throwable;

/**
 * Transport-level failure — no HTTP response received.
 */
final class NetworkException extends ApiRequestException
{
    /**
     * @param  string          $message
     * @param  Request|null    $request
     * @param  Throwable|null  $previous  Underlying `GuzzleHttp\Exception\ConnectException` or similar.
     */
    public function __construct(
        string $message,
        ?Request $request = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct(
            message: $message,
            statusCode: 0,
            request: $request,
            response: null,
            previous: $previous,
        );
    }
}
