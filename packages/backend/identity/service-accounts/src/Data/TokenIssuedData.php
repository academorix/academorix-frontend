<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Data;

use Stackra\Auth\Data\SignedJwtData;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire response for the token-exchange endpoint.
 *
 * Mirrors the shape documented in
 * `modules/identity/blueprints/service-accounts/readme.md` §3.2:
 *
 *     { "data": { "token": "eyJhbGc...", "expires_in": 300, "token_type": "Bearer" } }
 *
 * `token_type` is always `"Bearer"` today. The `jti` is deliberately
 * NOT returned to the client — a caller that needs to revoke MUST
 * decode the token client-side (jti is public in the payload).
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TokenIssuedData extends Data
{
    /**
     * @param  string  $token      The compact JWT. Safe to hand straight to the caller.
     * @param  int     $expiresIn  Seconds until natural expiry (payload.exp - payload.iat).
     * @param  string  $tokenType  Always `"Bearer"` in Wave 1a.
     */
    public function __construct(
        public string $token,
        public int $expiresIn,
        public string $tokenType = 'Bearer',
    ) {
    }

    /**
     * Named constructor from the signer's `SignedJwtData`.
     */
    public static function fromSigned(SignedJwtData $signed): self
    {
        return new self(
            token: $signed->token,
            expiresIn: $signed->expiresIn,
            tokenType: $signed->tokenType,
        );
    }
}
