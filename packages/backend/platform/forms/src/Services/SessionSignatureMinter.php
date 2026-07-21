<?php

declare(strict_types=1);

namespace Stackra\Forms\Services;

use Stackra\Forms\Contracts\Services\SessionSignatureMinterInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * HMAC-SHA256 signature minter + verifier for form sessions.
 *
 * Signature format: `<exp_ts>.<base64url-hmac>` where the HMAC covers
 * `<submission_id>|<form_version_id>|<tenant_id>|<exp_ts>` and the
 * key is a per-tenant secret derived from the app key + tenant id
 * via HKDF. This keeps signatures scoped per-tenant — a leak on
 * one tenant's session token cannot forge signatures for another.
 *
 * `#[Singleton]` — pure computation, no request state. The signing
 * key material comes from config once at boot.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Singleton]
final class SessionSignatureMinter implements SessionSignatureMinterInterface
{
    /**
     * @param  string  $appKey  Base64-encoded app-wide secret material — the root of the
     *                          per-tenant key derivation. Must be at least 32 bytes after
     *                          base64 decode.
     */
    public function __construct(
        #[Config('app.key')] private readonly string $appKey,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function mint(string $submissionId, string $formVersionId, string $tenantId, int $ttlSeconds = 86400): string
    {
        $exp = time() + max(60, $ttlSeconds); // Minimum 60s ttl to avoid clock-drift immediate expiry.
        $signature = $this->sign($submissionId, $formVersionId, $tenantId, $exp);

        return sprintf('%d.%s', $exp, $this->base64UrlEncode($signature));
    }

    /**
     * {@inheritDoc}
     */
    public function verify(string $signature, string $submissionId, string $formVersionId, string $tenantId): bool
    {
        $parts = explode('.', $signature, 2);
        if (count($parts) !== 2) {
            return false;
        }
        [$expString, $sigString] = $parts;
        if (! ctype_digit($expString)) {
            return false;
        }
        $exp = (int) $expString;
        if ($exp <= time()) {
            return false; // Expired.
        }

        $expected = $this->sign($submissionId, $formVersionId, $tenantId, $exp);
        $received = $this->base64UrlDecode($sigString);
        if ($received === null) {
            return false;
        }

        return hash_equals($expected, $received);
    }

    /**
     * HMAC-SHA256 over the canonical `(submission|version|tenant|exp)`
     * tuple with the per-tenant derived key.
     */
    private function sign(string $submissionId, string $formVersionId, string $tenantId, int $exp): string
    {
        $key = $this->deriveTenantKey($tenantId);
        $payload = "{$submissionId}|{$formVersionId}|{$tenantId}|{$exp}";

        return hash_hmac('sha256', $payload, $key, binary: true);
    }

    /**
     * Derive a per-tenant HMAC key from the app-wide secret via HKDF
     * (RFC 5869 with SHA-256). Domain-separates tenants so a leaked
     * session signature can never be replayed cross-tenant.
     */
    private function deriveTenantKey(string $tenantId): string
    {
        // Strip Laravel's `base64:` prefix if present.
        $encoded = $this->appKey;
        if (str_starts_with($encoded, 'base64:')) {
            $encoded = substr($encoded, strlen('base64:'));
        }
        $secret = base64_decode($encoded, true) ?: $this->appKey;

        return hash_hkdf('sha256', $secret, 32, "forms.session-signature.v1.{$tenantId}");
    }

    /**
     * Base64url-encode (RFC 4648 §5) — replaces `+` / `/` with
     * URL-safe characters and strips padding.
     */
    private function base64UrlEncode(string $bytes): string
    {
        return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
    }

    /**
     * Base64url-decode; return null on malformed input.
     */
    private function base64UrlDecode(string $encoded): ?string
    {
        $padded = strtr($encoded, '-_', '+/');
        $padded .= str_repeat('=', (4 - strlen($padded) % 4) % 4);
        $decoded = base64_decode($padded, true);

        return $decoded === false ? null : $decoded;
    }
}
