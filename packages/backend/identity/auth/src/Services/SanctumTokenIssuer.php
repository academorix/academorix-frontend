<?php

declare(strict_types=1);

namespace Academorix\Auth\Services;

use Academorix\Auth\Contracts\Services\SanctumTokenIssuerInterface;
use Academorix\Auth\Data\IssuedSanctumTokenData;
use Academorix\Identity\Models\Identity;
use Illuminate\Container\Attributes\Scoped;

/**
 * Concrete Sanctum PAT issuer.
 *
 * Thin bridge over Sanctum's `HasApiTokens::createToken()` that
 * returns an in-house Data DTO. The trait already generates a
 * cryptographically-secure plaintext token + persists the SHA-256
 * hash on `personal_access_tokens`; we don't reinvent either.
 *
 * `#[Scoped]` — the issuer touches the request-bound tenant
 * scope through the Identity model.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Scoped]
final class SanctumTokenIssuer implements SanctumTokenIssuerInterface
{
    /**
     * {@inheritDoc}
     */
    public function issue(
        Identity $identity,
        string $deviceName,
        array $abilities = ['*'],
    ): IssuedSanctumTokenData {
        // Sanctum's method returns a `NewAccessToken` value object
        // that carries BOTH the plaintext token (only available on
        // this call) and the persisted `PersonalAccessToken` row.
        // We hand the plaintext to the client via
        // IssuedSanctumTokenData and remember the row's id so a
        // subsequent DELETE / logout can target this specific
        // token.
        $sanctum = $identity->createToken(
            $deviceName,
            array_values(array_map(strval(...), $abilities)),
        );

        return IssuedSanctumTokenData::fromNewAccessToken($sanctum, $deviceName);
    }
}
