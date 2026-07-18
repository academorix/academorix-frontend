<?php

/**
 * @file packages/sdk/api-sdk/src/Authentication/ApiKeyAuthenticator.php
 *
 * @description
 * Saloon `Authenticator` implementation that stamps a custom
 * header on the outgoing request. Unlike Saloon's built-in
 * `TokenAuthenticator` (which always emits `Authorization: Bearer <token>`),
 * this one lets consumers configure both the header name and
 * the raw value — needed for X-API-Key-style authentication
 * where `apps/api` deliberately doesn't use the Authorization
 * header (e.g. because it's already used by a downstream JWT
 * scheme).
 *
 * ## When to use which
 *
 *   - `Saloon\Http\Auth\TokenAuthenticator` — Sanctum personal-
 *     access tokens, JWT, OAuth bearer. Set
 *     `sdk.api.auth.strategy = bearer`.
 *
 *   - `ApiKeyAuthenticator` — custom header schemes (`X-API-Key`,
 *     `X-Service-Token`). Set `sdk.api.auth.strategy = api-key`
 *     and `sdk.api.auth.header = X-API-Key`.
 *
 * The authenticator is immutable — Saloon calls `set()` once per
 * request; the value is captured in the constructor and never
 * mutated.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Authentication;

use Saloon\Contracts\Authenticator;
use Saloon\Http\PendingRequest;

/**
 * Sets a custom header on every request. Compatible with any
 * API-Key scheme where the header value IS the credential.
 */
final readonly class ApiKeyAuthenticator implements Authenticator
{
    /**
     * @param  string  $header  Header name, e.g. `X-API-Key`.
     * @param  string  $value   Header value — the raw API key.
     */
    public function __construct(
        private string $header,
        private string $value,
    ) {
    }

    /**
     * Apply the credential to a pending request. Saloon calls
     * this once per dispatch.
     */
    public function set(PendingRequest $pendingRequest): void
    {
        $pendingRequest->headers()->add($this->header, $this->value);
    }
}
