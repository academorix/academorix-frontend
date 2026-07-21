<?php

/**
 * @file packages/sdk/api-sdk/src/Enums/AuthStrategy.php
 *
 * @description
 * The authentication strategies the SDK connector understands
 * for outbound requests to `apps/api`.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Enums;

use Stackra\Enum\Enum;

/**
 * Which Saloon authenticator the connector installs.
 *
 * The mapping to concrete Saloon primitives:
 *
 *   - `Bearer` → `Saloon\Http\Auth\TokenAuthenticator` +
 *      `Authorization: Bearer <token>` header.
 *   - `ApiKey` → `Stackra\ApiSdk\Authentication\ApiKeyAuthenticator`
 *      with the header name from `sdk.api.auth.header`.
 *   - `None`   — no auth; used for the SDK's health-probe
 *      endpoint when the token isn't available yet (bootstrap
 *      phase) or when the target endpoint is public.
 */
enum AuthStrategy: string
{
    use Enum;

    /** Sanctum-style bearer token — the default. */
    case Bearer = 'bearer';

    /** Custom-header API-key strategy (typically `X-API-Key`). */
    case ApiKey = 'api-key';

    /** No auth — reserved for public / health endpoints. */
    case None = 'none';
}
