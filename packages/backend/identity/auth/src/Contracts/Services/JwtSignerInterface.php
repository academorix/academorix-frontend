<?php

declare(strict_types=1);

namespace Academorix\Auth\Contracts\Services;

use Academorix\Auth\Data\JwtPayloadData;
use Academorix\Auth\Data\SignedJwtData;
use Academorix\Auth\Services\JwtSigner;
use Illuminate\Container\Attributes\Bind;

/**
 * Service contract for the HS256 inter-service JWT signer.
 *
 * Signs {@see JwtPayloadData} into a compact `<b64url(header)>.<b64url(payload)>.<b64url(signature)>`
 * token per RFC 7519, matching the shape documented in
 * `modules/identity/blueprints/auth/data/jwt-payload-example.json`.
 * The signer NEVER writes plaintext secrets to disk, log lines, or
 * response bodies — the shared secret is read from Doppler
 * (`SERVICE_JWT_SECRET`) with a hard >=32-byte floor, or resolved
 * per `kid` from `auth_jwt_signing_keys` when key rotation is in
 * flight.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Bind(JwtSigner::class)]
interface JwtSignerInterface
{
    /**
     * Sign a structured payload into a compact HS256 JWT.
     *
     * @param  JwtPayloadData  $payload  Fully-populated payload.
     *   Every REQUIRED field on the JWT-payload schema must be
     *   supplied by the caller; the signer will NOT auto-populate
     *   `iat` / `exp` / `jti` — those are the caller's contract.
     *
     * @return SignedJwtData  The compact JWT string + its own
     *   materialised claims. The `token` field is safe to hand
     *   straight to a client; the `jti` echoed back is what the
     *   deny-list manager keys off during revocation.
     *
     * @throws \Academorix\Auth\Exceptions\JwtSigningKeyUnavailableException
     *   When no active signing key exists for the payload's `app`
     *   claim AND the `SERVICE_JWT_SECRET` boot secret is unset.
     */
    public function sign(JwtPayloadData $payload): SignedJwtData;

    /**
     * Return the currently-active `kid` for the given Application.
     *
     * Used by the token-exchange endpoint + service account issuer
     * so both sides agree on the same key without repeating the
     * lookup logic. Null when no rotation-registered key exists —
     * the signer will then fall back to the boot secret's
     * synthetic kid.
     *
     * @param  string|null  $applicationId  Application ULID
     *   (`app_...`). Null selects the platform-plane / global key.
     *
     * @return string|null  The active `kid`, or null when only the
     *   boot secret's synthetic kid is available.
     */
    public function activeKidFor(?string $applicationId): ?string;
}
