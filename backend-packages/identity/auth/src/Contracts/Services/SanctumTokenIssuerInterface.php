<?php

declare(strict_types=1);

namespace Academorix\Auth\Contracts\Services;

use Academorix\Auth\Data\IssuedSanctumTokenData;
use Academorix\Identity\Models\Identity;
use Academorix\Auth\Services\SanctumTokenIssuer;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for issuing Laravel Sanctum personal-access tokens
 * (PATs) against an {@see Identity}.
 *
 * The issuer is the ONLY path new PATs land in the codebase —
 * every login / cross-app SSO / support-impersonation flow ends
 * up here. Direct calls to `$identity->createToken(...)` from
 * feature code are a compliance failure; go through the issuer
 * so ability rollout + rate signal + audit log stay uniform.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Bind(SanctumTokenIssuer::class)]
interface SanctumTokenIssuerInterface
{
    /**
     * Issue a Sanctum PAT for an Identity.
     *
     * @param  Identity      $identity   The subject; must be
     *   verified + not locked out (the caller ensures this).
     * @param  string        $deviceName Human-readable device tag
     *   stored on the row. Kept short — "iPhone 15", "Chrome on
     *   MacBook Pro", "backend-service".
     * @param  list<string>  $abilities  Sanctum abilities. Default
     *   `['*']` grants full access; scoped tokens pass
     *   `['api:read']`, `['admin:tenant']`, etc.
     *
     * @return IssuedSanctumTokenData  The plaintext token (once,
     *   never again) plus its persistent id.
     */
    public function issue(
        Identity $identity,
        string $deviceName,
        array $abilities = ['*'],
    ): IssuedSanctumTokenData;
}
