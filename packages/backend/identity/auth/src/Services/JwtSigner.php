<?php

declare(strict_types=1);

namespace Academorix\Auth\Services;

use Academorix\Auth\Contracts\Data\AuthJwtSigningKeyInterface;
use Academorix\Auth\Contracts\Repositories\AuthJwtSigningKeyRepositoryInterface;
use Academorix\Auth\Contracts\Services\JwtSignerInterface;
use Academorix\Auth\Data\JwtPayloadData;
use Academorix\Auth\Data\SignedJwtData;
use Academorix\Auth\Exceptions\JwtSecretMisconfiguredException;
use Academorix\Auth\Exceptions\JwtSigningKeyUnavailableException;
use Academorix\Auth\Models\AuthJwtSigningKey;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Encryption\Encrypter;

/**
 * HS256 inter-service JWT signer.
 *
 * Signs {@see JwtPayloadData} → compact JWT per RFC 7519 §7.1.
 * The shared secret is resolved with a two-step fallback:
 *
 *   1. Look up the active `auth_jwt_signing_keys` row for the
 *      payload's `app` claim. If present, decrypt its
 *      `secret_encrypted` column via the Laravel encrypter.
 *   2. Otherwise fall back to `SERVICE_JWT_SECRET` (Doppler-loaded
 *      config). The synthetic kid `service-jwt-default` names the
 *      boot secret so downstream verifiers can distinguish rotated
 *      keys from the boot-time seed.
 *
 * Any resolved secret shorter than 32 bytes triggers a hard-fail
 * — HS256 with a weak secret is bruteforceable, and the trust
 * boundary is not the place to be permissive.
 *
 * `#[Scoped]` because the signer reaches per-request state
 * (correlation id via the encrypter's request-bound cipher). A
 * `#[Singleton]` would capture the boot-time encrypter reference,
 * which is safe today but constrains future config-driven cipher
 * swaps.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Scoped]
final class JwtSigner implements JwtSignerInterface
{
    /**
     * Minimum acceptable HS256 secret length. RFC 7518 §3.2 mandates
     * "a key of the same size as the hash output (for HS256, 32
     * bytes) or larger". We reject anything shorter at boot.
     */
    private const int HS256_MIN_SECRET_BYTES = 32;

    /**
     * Synthetic `kid` used when only the boot secret is available
     * and no rotation-registered row lives in `auth_jwt_signing_keys`.
     * Callers verifying a token signed under this kid MUST hold the
     * same `SERVICE_JWT_SECRET` value.
     */
    public const string DEFAULT_BOOT_KID = 'service-jwt-default';

    /**
     * @param  AuthJwtSigningKeyRepositoryInterface  $keys        Signing-key registry.
     * @param  Encrypter                             $encrypter   Laravel encrypter — decrypts `secret_encrypted`.
     * @param  string|null                           $bootSecret  Fallback secret from Doppler.
     */
    public function __construct(
        private readonly AuthJwtSigningKeyRepositoryInterface $keys,
        private readonly Encrypter $encrypter,
        #[Config('auth.jwt.service_jwt_secret')]
        private readonly ?string $bootSecret = null,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function sign(JwtPayloadData $payload): SignedJwtData
    {
        // Resolve the raw HS256 secret via the two-step fallback.
        // We RE-VALIDATE the length here even though bootBoot() runs
        // at provider boot — the DB path could return a legacy row
        // that predates the length rule, and defence in depth beats
        // trust.
        [$kid, $secret] = $this->resolveSigningKey($payload);

        // Header — every SA and user-session JWT ships alg=HS256.
        // The `typ: JWT` header is optional per RFC 7519 but the
        // verifier expects it, so we emit it unconditionally.
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
            'kid' => $kid,
        ];

        // base64url per RFC 4648 §5 (no padding).
        $encodedHeader = self::b64urlEncode(json_encode($header, \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR));
        $encodedPayload = self::b64urlEncode(json_encode($payload->toClaims(), \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR));

        // HMAC-SHA256 over the two encoded segments joined by `.`.
        // `hash_hmac()` returns raw bytes when the fourth argument
        // is true — we then base64url-encode those raw bytes.
        $signingInput = $encodedHeader . '.' . $encodedPayload;
        $signature = hash_hmac('sha256', $signingInput, $secret, true);
        $encodedSignature = self::b64urlEncode($signature);

        $token = $signingInput . '.' . $encodedSignature;

        return new SignedJwtData(
            token: $token,
            jti: $payload->jti,
            kid: $kid,
            expiresAt: $payload->exp,
            expiresIn: $payload->exp - $payload->iat,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function activeKidFor(?string $applicationId): ?string
    {
        // Delegate to the repo's lookup — a null return means no
        // rotation-registered row exists and callers should let the
        // signer fall through to the boot secret's synthetic kid.
        $key = $this->activeKeyRow($applicationId);

        return $key?->getAttribute(AuthJwtSigningKeyInterface::ATTR_KID);
    }

    /**
     * Boot-time invariant — refuse to serve when the shared secret
     * is unset, empty, or shorter than the HS256 minimum. Called
     * from `AuthServiceProvider`'s `#[OnBoot]` hook so a
     * misconfigured secret fails at startup, not at first request.
     *
     * @throws JwtSecretMisconfiguredException
     */
    public function assertBootSecretValid(): void
    {
        if ($this->bootSecret === null || $this->bootSecret === '') {
            throw JwtSecretMisconfiguredException::make(
                'SERVICE_JWT_SECRET is not set — HS256 signing cannot proceed.',
            )->withHttpStatus(500);
        }

        if (strlen($this->bootSecret) < self::HS256_MIN_SECRET_BYTES) {
            throw JwtSecretMisconfiguredException::make(sprintf(
                'SERVICE_JWT_SECRET is %d bytes; HS256 requires at least %d.',
                strlen($this->bootSecret),
                self::HS256_MIN_SECRET_BYTES,
            ))->withHttpStatus(500);
        }
    }

    /**
     * Resolve the signing key for a payload: prefer a rotation
     * row keyed by the payload's `app` claim; fall back to the
     * boot secret.
     *
     * @return array{0: string, 1: string}  [kid, raw-secret-bytes].
     *
     * @throws JwtSigningKeyUnavailableException
     */
    private function resolveSigningKey(JwtPayloadData $payload): array
    {
        // Step 1 — the caller MAY have pre-populated `kid` in the
        // payload. When they did, honour it: the token's audience
        // needs a specific kid (e.g. issued for a service account
        // that names its own signer_kid). Look it up by kid.
        if ($payload->kid !== '' && $payload->kid !== self::DEFAULT_BOOT_KID) {
            $key = $this->keyRowByKid($payload->kid);
            if ($key !== null) {
                return [$payload->kid, $this->decryptKeyMaterial($key)];
            }
        }

        // Step 2 — resolve the active row for this Application.
        $applicationClaim = $payload->app === '' ? null : $payload->app;
        $key = $this->activeKeyRow($applicationClaim);
        if ($key !== null) {
            return [
                (string) $key->getAttribute(AuthJwtSigningKeyInterface::ATTR_KID),
                $this->decryptKeyMaterial($key),
            ];
        }

        // Step 3 — fall back to the boot secret. If it's unset or
        // short, throw the same "signing key unavailable" error the
        // rotation path would throw — callers see one code, not
        // two.
        if ($this->bootSecret === null || strlen($this->bootSecret) < self::HS256_MIN_SECRET_BYTES) {
            throw JwtSigningKeyUnavailableException::make(
                'No active signing key for application "' . $payload->app . '" and no valid boot secret.',
            )->withHttpStatus(500);
        }

        return [self::DEFAULT_BOOT_KID, $this->bootSecret];
    }

    /**
     * Look up the active signing-key row for an application.
     *
     * @param  string|null  $applicationId  Application ULID, or null for platform-plane.
     */
    private function activeKeyRow(?string $applicationId): ?AuthJwtSigningKey
    {
        $query = $this->keys->query()
            ->where(AuthJwtSigningKeyInterface::ATTR_IS_ACTIVE, true)
            ->whereNull(AuthJwtSigningKeyInterface::ATTR_RETIRED_AT);

        // Platform-plane keys have NULL application_id; app-scoped
        // keys carry a value. Match strictly — a Sports key must
        // never sign a Marketplace payload.
        if ($applicationId === null) {
            $query->whereNull(AuthJwtSigningKeyInterface::ATTR_APPLICATION_ID);
        } else {
            $query->where(AuthJwtSigningKeyInterface::ATTR_APPLICATION_ID, $applicationId);
        }

        /** @var AuthJwtSigningKey|null */
        return $query->first();
    }

    /**
     * Look up a signing key by its `kid` — the verifier's lookup
     * path, exposed here so the signer can honour a caller-supplied
     * kid when it references a specific rotation row.
     */
    private function keyRowByKid(string $kid): ?AuthJwtSigningKey
    {
        /** @var AuthJwtSigningKey|null */
        return $this->keys->query()
            ->where(AuthJwtSigningKeyInterface::ATTR_KID, $kid)
            ->whereNull(AuthJwtSigningKeyInterface::ATTR_RETIRED_AT)
            ->first();
    }

    /**
     * Decrypt the `secret_encrypted` column value.
     *
     * @throws JwtSigningKeyUnavailableException  On decrypt failure.
     */
    private function decryptKeyMaterial(AuthJwtSigningKey $key): string
    {
        $encrypted = (string) $key->getAttribute(AuthJwtSigningKeyInterface::ATTR_SECRET_ENCRYPTED);

        try {
            // Laravel's default encrypter returns the raw string —
            // for HS256 that's the shared secret bytes.
            $secret = (string) $this->encrypter->decrypt($encrypted);
        } catch (DecryptException $e) {
            throw JwtSigningKeyUnavailableException::make(
                'Failed to decrypt signing-key secret for kid "' . $key->getAttribute(AuthJwtSigningKeyInterface::ATTR_KID) . '".',
                previous: $e,
            )->withHttpStatus(500);
        }

        // Defence-in-depth — a legacy row may have been written
        // before the 32-byte floor. Refuse rather than sign weakly.
        if (strlen($secret) < self::HS256_MIN_SECRET_BYTES) {
            throw JwtSigningKeyUnavailableException::make(sprintf(
                'Signing-key secret for kid "%s" is %d bytes; HS256 requires at least %d.',
                (string) $key->getAttribute(AuthJwtSigningKeyInterface::ATTR_KID),
                strlen($secret),
                self::HS256_MIN_SECRET_BYTES,
            ))->withHttpStatus(500);
        }

        return $secret;
    }

    /**
     * base64url encode per RFC 4648 §5 — no padding, `-` / `_`
     * instead of `+` / `/`.
     */
    public static function b64urlEncode(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    /**
     * base64url decode per RFC 4648 §5. Returns `false` on invalid
     * input — the caller MUST check.
     */
    public static function b64urlDecode(string $encoded): string|false
    {
        // base64_decode with strict=true rejects any character
        // outside the alphabet — but we've already translated the
        // URL-safe chars back to the standard alphabet, so any
        // remaining stray character IS an error. Pad to a multiple
        // of 4 for base64_decode.
        $translated = strtr($encoded, '-_', '+/');
        $padding = strlen($translated) % 4;
        if ($padding > 0) {
            $translated .= str_repeat('=', 4 - $padding);
        }

        return base64_decode($translated, true);
    }
}
