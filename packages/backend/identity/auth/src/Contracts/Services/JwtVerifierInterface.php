<?php

declare(strict_types=1);

namespace Academorix\Auth\Contracts\Services;

use Academorix\Auth\Data\JwtPayloadData;
use Academorix\Auth\Services\JwtVerifier;
use Illuminate\Container\Attributes\Bind;

/**
 * Service contract for the HS256 inter-service JWT verifier.
 *
 * Applies the FULL 13-step verification list from
 * `modules/identity/blueprints/auth/data/jwt-payload-example.json`
 * §signature_verification_algorithm: split-decode, alg equality
 * ("HS256" only — `none` REFUSED with prejudice), constant-time
 * signature compare via {@see hash_equals()}, `iss`/`aud`/`exp`/
 * `iat` checks with configurable clock skew tolerance, and a
 * deny-list check via {@see JwtDenyListManagerInterface}.
 *
 * The verifier NEVER trusts the JWT header's `alg` field beyond a
 * plain equality check against the kid's registered algorithm —
 * this defeats the classic alg-confusion attacks that swap HS256
 * for RS256 or `none`.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Bind(JwtVerifier::class)]
interface JwtVerifierInterface
{
    /**
     * Verify a compact JWT and return its decoded payload.
     *
     * @param  string  $token  The compact JWT — three base64url
     *   segments joined by `.`. Whitespace + `Bearer ` prefix are
     *   NOT stripped; the caller passes the raw token.
     * @param  string|null  $expectedAudience  Downstream service's
     *   own hostname — matched against the `aud[]` array. Null
     *   skips the audience check (only appropriate for the issuer
     *   itself).
     *
     * @return JwtPayloadData  The verified payload. The absence of
     *   an exception is the "success" signal — every failure path
     *   throws.
     *
     * @throws \Academorix\Auth\Exceptions\JwtInvalidException
     *   Whenever any of the 13 verification steps fails. The
     *   exception's `context` names the failing step but the
     *   client-visible payload is uniform to prevent enumeration.
     */
    public function verify(string $token, ?string $expectedAudience = null): JwtPayloadData;
}
