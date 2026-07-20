<?php

declare(strict_types=1);

namespace Academorix\Auth\Data;

use Spatie\LaravelData\Data;

/**
 * The output of a successful sign operation.
 *
 * Carries the compact JWT string alongside the derived metadata
 * (`jti`, `expiresAt`, `expiresIn`) that callers usually want to
 * echo back to the client — so they don't have to re-decode the
 * token they just handed us to compute them.
 *
 * The `token` is safe to hand straight to a caller. The `jti` is
 * what the deny-list manager keys off during revocation; hold on
 * to it if you need to revoke the token before its natural expiry.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
final class SignedJwtData extends Data
{
    /**
     * @param  string  $token      Compact JWT — three base64url segments joined by `.`.
     * @param  string  $jti        The JWT's `jti` claim (deny-list key).
     * @param  string  $kid        The `kid` used to sign (echoes payload.kid).
     * @param  int     $expiresAt  Unix timestamp — payload `exp` claim.
     * @param  int     $expiresIn  Seconds until expiry (payload.exp - payload.iat).
     * @param  string  $tokenType  Always `"Bearer"` today. Wave 1c may add others.
     */
    public function __construct(
        public readonly string $token,
        public readonly string $jti,
        public readonly string $kid,
        public readonly int $expiresAt,
        public readonly int $expiresIn,
        public readonly string $tokenType = 'Bearer',
    ) {
    }
}
