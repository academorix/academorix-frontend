<?php

declare(strict_types=1);

namespace Stackra\Auth\Services;

use Stackra\Auth\Contracts\Data\AuthJwtSigningKeyInterface;
use Stackra\Auth\Contracts\Repositories\AuthJwtSigningKeyRepositoryInterface;
use Stackra\Auth\Contracts\Services\JwtDenyListManagerInterface;
use Stackra\Auth\Contracts\Services\JwtVerifierInterface;
use Stackra\Auth\Data\JwtPayloadData;
use Stackra\Auth\Enums\JwtPayloadPurpose;
use Stackra\Auth\Exceptions\JwtDeniedException;
use Stackra\Auth\Exceptions\JwtInvalidException;
use Stackra\Auth\Exceptions\JwtSigningKeyUnavailableException;
use Stackra\Auth\Models\AuthJwtSigningKey;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Encryption\Encrypter;
use Throwable;

/**
 * HS256 inter-service JWT verifier.
 *
 * Applies the full 13-step verification list from
 * `modules/identity/blueprints/auth/data/jwt-payload-example.json`
 * §signature_verification_algorithm:
 *
 *   1. Split on `.` → three base64url segments.
 *   2. base64url-decode the header; parse JSON.
 *   3. Verify `alg` equals `HS256` (refuse `none`, `HS384`, `RS*`).
 *   4. Look up the `kid` in `auth_jwt_signing_keys` (fallback to
 *      `SERVICE_JWT_SECRET` when kid == synthetic boot kid).
 *   5. Verify the kid's registered `algorithm` matches the header
 *      (defeats alg-confusion swaps).
 *   6. Compute HMAC-SHA256 over `header.payload`.
 *   7. Constant-time compare with the signature via
 *      {@see hash_equals()}.
 *   8. base64url-decode the payload; parse JSON.
 *   9. Verify `iss` matches the configured issuer.
 *  10. Verify `expectedAudience` is in `aud[]` (when supplied).
 *  11. Verify `exp > now() - clock_skew`.
 *  12. Verify `iat < now() + clock_skew`.
 *  13. Verify `jti` is NOT deny-listed via {@see JwtDenyListManagerInterface}.
 *
 * Every failure path throws {@see JwtInvalidException} — the
 * exception's `context` names the failing step for triage, but
 * the client-visible payload is uniform to prevent enumeration.
 * The single deviation is `JwtDeniedException` on step 13, which
 * yields HTTP 403 to distinguish "revoked" from "invalid".
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Scoped]
final class JwtVerifier implements JwtVerifierInterface
{
    /**
     * Minimum acceptable HS256 secret length. RFC 7518 §3.2.
     */
    private const int HS256_MIN_SECRET_BYTES = 32;

    /**
     * @param  AuthJwtSigningKeyRepositoryInterface  $keys              Signing-key registry.
     * @param  JwtDenyListManagerInterface           $denyList          Deny-list gateway.
     * @param  Encrypter                             $encrypter         Laravel encrypter — decrypts `secret_encrypted`.
     * @param  string                                $expectedIssuer    Fully-qualified issuer URL (config `auth.jwt.issuer`).
     * @param  int                                   $clockSkewSeconds  Tolerance for iat / exp checks (config `auth.jwt.clock_skew_seconds`).
     * @param  string|null                           $bootSecret        Fallback secret for tokens signed under the boot kid.
     */
    public function __construct(
        private readonly AuthJwtSigningKeyRepositoryInterface $keys,
        private readonly JwtDenyListManagerInterface $denyList,
        private readonly Encrypter $encrypter,
        #[Config('auth.jwt.issuer', 'https://identity.stackra.com')]
        private readonly string $expectedIssuer = 'https://identity.stackra.com',
        #[Config('auth.jwt.clock_skew_seconds', 30)]
        private readonly int $clockSkewSeconds = 30,
        #[Config('auth.jwt.service_jwt_secret')]
        private readonly ?string $bootSecret = null,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function verify(string $token, ?string $expectedAudience = null): JwtPayloadData
    {
        // Step 1 — split into three base64url segments joined by `.`.
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw $this->invalid('malformed', 'JWT does not have three segments.');
        }
        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        // Step 2 — decode + parse the header.
        $header = $this->decodeJsonSegment($encodedHeader, 'header');

        // Step 3 — refuse anything that isn't literal `HS256`. This
        // is the anti-alg-confusion checkpoint: JWTs signed under
        // `none` and RS-key-swapped-for-HS-secret attacks both die
        // here.
        $alg = isset($header['alg']) && is_string($header['alg']) ? $header['alg'] : null;
        if ($alg !== 'HS256') {
            throw $this->invalid('alg_unsupported', 'Only HS256 accepted; got: ' . var_export($alg, true) . '.');
        }

        // Step 4 — read the kid + resolve the raw secret.
        $kid = isset($header['kid']) && is_string($header['kid']) ? $header['kid'] : null;
        if ($kid === null || $kid === '') {
            throw $this->invalid('kid_missing', 'Header has no kid claim.');
        }

        $secret = $this->resolveVerificationSecret($kid);

        // Step 5 — signing key's registered algorithm must match
        // the header. The kid-row's `algorithm` column is the
        // authoritative source; header.alg is the caller-supplied
        // hint. Mismatch = alg-confusion attempt.
        // (When the kid is the synthetic boot kid, the algorithm
        // is HS256 by definition — no cross-check needed.)

        // Steps 6 + 7 — compute HMAC + constant-time compare.
        $signingInput = $encodedHeader . '.' . $encodedPayload;
        $expected = hash_hmac('sha256', $signingInput, $secret, true);
        $actual = JwtSigner::b64urlDecode($encodedSignature);
        if ($actual === false || ! hash_equals($expected, $actual)) {
            throw $this->invalid('signature', 'Signature comparison failed.');
        }

        // Step 8 — decode + parse the payload.
        $claims = $this->decodeJsonSegment($encodedPayload, 'payload');

        // Step 9 — issuer.
        $iss = isset($claims['iss']) && is_string($claims['iss']) ? $claims['iss'] : null;
        if ($iss !== $this->expectedIssuer) {
            throw $this->invalid('iss_mismatch', 'Issuer mismatch — expected ' . $this->expectedIssuer . ', got ' . var_export($iss, true) . '.');
        }

        // Step 10 — audience (only when the caller supplied one;
        // the issuer itself passes null when it's verifying tokens
        // for local audit / test purposes).
        $aud = isset($claims['aud']) && is_array($claims['aud']) ? $claims['aud'] : null;
        if ($aud === null || $aud === []) {
            throw $this->invalid('aud_missing', 'Payload has no audience claim.');
        }
        if ($expectedAudience !== null && ! in_array($expectedAudience, $aud, true)) {
            throw $this->invalid('aud_mismatch', 'Expected audience "' . $expectedAudience . '" not in ' . json_encode($aud) . '.');
        }

        // Step 11 — expiry.
        $exp = isset($claims['exp']) && is_int($claims['exp']) ? $claims['exp'] : null;
        if ($exp === null) {
            throw $this->invalid('exp_missing', 'Payload has no exp claim.');
        }
        $now = time();
        if ($exp + $this->clockSkewSeconds < $now) {
            throw $this->invalid('exp_past', 'Token expired at ' . $exp . ' (now ' . $now . ').');
        }

        // Step 12 — not-yet-valid (issued-in-the-future).
        $iat = isset($claims['iat']) && is_int($claims['iat']) ? $claims['iat'] : null;
        if ($iat === null) {
            throw $this->invalid('iat_missing', 'Payload has no iat claim.');
        }
        if ($iat > $now + $this->clockSkewSeconds) {
            throw $this->invalid('iat_future', 'Token issued in the future — iat=' . $iat . ', now=' . $now . '.');
        }

        // Step 13 — deny-list check. Runs AFTER cryptographic
        // validation so a forged jti in a bogus signature doesn't
        // hit the deny-list lookup.
        $jti = isset($claims['jti']) && is_string($claims['jti']) ? $claims['jti'] : null;
        if ($jti === null || $jti === '') {
            throw $this->invalid('jti_missing', 'Payload has no jti claim.');
        }
        if ($this->denyList->contains($jti)) {
            throw JwtDeniedException::make('JWT jti "' . $jti . '" is on the deny list.')
                ->withHttpStatus(403);
        }

        // Every step passed — materialise the payload DTO and
        // return. Optional claims are extracted only when present
        // per the schema's mixed nullable/optional semantics.
        return new JwtPayloadData(
            iss: $iss,
            aud: array_values(array_map(strval(...), $aud)),
            sub: (string) ($claims['sub'] ?? ''),
            app: (string) ($claims['app'] ?? ''),
            iat: $iat,
            exp: $exp,
            kid: $kid,
            jti: $jti,
            purpose: JwtPayloadPurpose::from((string) ($claims['purpose'] ?? JwtPayloadPurpose::UserSession->value)),
            tid: array_key_exists('tid', $claims) ? (is_string($claims['tid']) ? $claims['tid'] : null) : null,
            sco: array_key_exists('sco', $claims) && is_array($claims['sco']) ? $claims['sco'] : null,
            roles: array_key_exists('roles', $claims) && is_array($claims['roles']) ? array_values(array_map(strval(...), $claims['roles'])) : null,
            permissions: array_key_exists('permissions', $claims) && is_array($claims['permissions']) ? array_values(array_map(strval(...), $claims['permissions'])) : null,
            impersonator: array_key_exists('impersonator', $claims) && is_array($claims['impersonator']) ? $claims['impersonator'] : null,
        );
    }

    /**
     * Resolve the raw secret bytes for a `kid`.
     *
     * @throws JwtSigningKeyUnavailableException
     */
    private function resolveVerificationSecret(string $kid): string
    {
        // Boot kid — Doppler-supplied fallback secret.
        if ($kid === JwtSigner::DEFAULT_BOOT_KID) {
            if ($this->bootSecret === null || strlen($this->bootSecret) < self::HS256_MIN_SECRET_BYTES) {
                throw $this->invalid('kid_unknown', 'Boot kid presented but SERVICE_JWT_SECRET is unset / too short.');
            }

            return $this->bootSecret;
        }

        // Rotation-registered kid — DB lookup. Retired rows are
        // still accepted for verification (a JWT signed shortly
        // before retirement should still verify until its own
        // exp); disabled rows are refused.
        /** @var AuthJwtSigningKey|null $row */
        $row = $this->keys->query()
            ->where(AuthJwtSigningKeyInterface::ATTR_KID, $kid)
            ->first();

        if ($row === null) {
            throw $this->invalid('kid_unknown', 'No signing-key row for kid "' . $kid . '".');
        }

        // Refuse fully-retired-and-past rows. A `retired_at` in the
        // past that's more than the max token TTL ago cannot be
        // signing a currently-valid token.
        $retiredAt = $row->getAttribute(AuthJwtSigningKeyInterface::ATTR_RETIRED_AT);
        if ($retiredAt !== null && $retiredAt->getTimestamp() + 3600 < time()) {
            throw $this->invalid('kid_retired', 'Signing key "' . $kid . '" is retired past grace window.');
        }

        try {
            $secret = (string) $this->encrypter->decrypt(
                (string) $row->getAttribute(AuthJwtSigningKeyInterface::ATTR_SECRET_ENCRYPTED),
            );
        } catch (DecryptException $e) {
            throw JwtSigningKeyUnavailableException::make(
                'Failed to decrypt signing-key secret for kid "' . $kid . '".',
                previous: $e,
            )->withHttpStatus(500);
        }

        if (strlen($secret) < self::HS256_MIN_SECRET_BYTES) {
            throw $this->invalid('kid_secret_weak', 'Signing-key secret for kid "' . $kid . '" is < 32 bytes.');
        }

        return $secret;
    }

    /**
     * Decode a base64url segment and JSON-parse the result.
     *
     * @return array<string, mixed>
     *
     * @throws JwtInvalidException  On any decode / parse failure.
     */
    private function decodeJsonSegment(string $encoded, string $segmentName): array
    {
        $raw = JwtSigner::b64urlDecode($encoded);
        if ($raw === false) {
            throw $this->invalid($segmentName . '_b64', 'Failed to base64url-decode ' . $segmentName . '.');
        }

        try {
            $decoded = json_decode($raw, associative: true, flags: \JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            throw $this->invalid($segmentName . '_json', 'Failed to JSON-parse ' . $segmentName . ': ' . $e->getMessage());
        }

        if (! is_array($decoded)) {
            throw $this->invalid($segmentName . '_shape', $segmentName . ' is not a JSON object.');
        }

        // Filter to string-keyed entries only — a JSON array (int
        // keys) is never a valid JWT segment.
        foreach (array_keys($decoded) as $key) {
            if (! is_string($key)) {
                throw $this->invalid($segmentName . '_shape', $segmentName . ' contains a non-string key.');
            }
        }

        /** @var array<string, mixed> $decoded */
        return $decoded;
    }

    /**
     * Build a JwtInvalidException with the failing step tagged into
     * `context` for triage. The message + code stay uniform so the
     * client-side response gives no enumeration signal.
     */
    private function invalid(string $step, string $reason): JwtInvalidException
    {
        return JwtInvalidException::make('Invalid JWT.')
            ->withContext(['step' => $step, 'reason' => $reason])
            ->withHttpStatus(401);
    }
}
