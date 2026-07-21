<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/ServerException.php
 *
 * @description
 * Thrown on HTTP 5xx responses. The API is up but returned an
 * error — usually retryable (500 during a deploy, 502 while a
 * load balancer is draining, 503 during scale-up).
 *
 * The SDK's retry middleware handles this automatically when
 * `sdk.api.retry.enabled` is `true`. Consumers seeing this
 * exception have already exhausted the retry budget.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Exceptions;

/**
 * HTTP 5xx — the API returned a server error.
 */
final class ServerException extends ApiRequestException
{
}
