<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/AuthorizationException.php
 *
 * @description
 * Thrown on HTTP 403 responses. The caller's identity is valid
 * but the target endpoint's authorization policy rejected them.
 *
 * ## Consumer contract
 *
 * NOT retryable. Human intervention required — either the caller
 * needs additional permissions or the request itself references
 * a resource the caller doesn't own.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Exceptions;

/**
 * HTTP 403 — the API rejected the caller's authorization.
 */
final class AuthorizationException extends ApiRequestException
{
}
