<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/AuthenticationException.php
 *
 * @description
 * Thrown on HTTP 401 responses. Semantically distinct from
 * {@see AuthorizationException} (403) — 401 means the caller's
 * identity couldn't be verified (invalid / expired / missing
 * token); 403 means the identity is known but not permitted.
 *
 * ## Consumer contract
 *
 * The SDK's auth authenticator catches this exception once,
 * triggers a token refresh (when supported by the auth
 * strategy), and retries the original request. If the second
 * attempt also 401s the exception is re-thrown to the caller —
 * that's a fatal auth failure requiring human intervention (bad
 * credentials, revoked token, clock skew on JWT `exp`).
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Exceptions;

/**
 * HTTP 401 — the API rejected the caller's credentials.
 */
final class AuthenticationException extends ApiRequestException
{
}
