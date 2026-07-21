<?php

declare(strict_types=1);

namespace Stackra\Attribution\Services;

use Stackra\Attribution\Contracts\Services\IpHasherInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;

/**
 * GDPR/CCPA-safe IP hasher.
 *
 * Storing raw IP addresses is a Personal Data classification under
 * GDPR + CCPA. The attribution module needs to correlate touchpoints
 * across sessions (same IP => probable same visitor before login)
 * WITHOUT storing the reversible IP. Solution: HMAC the IP with a
 * rotating daily secret. The rolling secret means an intruder who
 * gains access to the store can correlate within a day but not
 * across weeks.
 *
 * The daily rotation is derived from the app key + `Y-m-d` so all
 * app instances agree without needing shared state; deployments
 * that need cross-day correlation for their own analytics can
 * disable rotation via `attribution.ip_hash_rotation` config.
 *
 * `#[Singleton]` — pure computation.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Singleton]
final class IpHasher implements IpHasherInterface
{
    /**
     * @param  string  $appKey          Base64-encoded app key (secret material).
     * @param  bool    $dailyRotation   When true, the hash rotates every day so an
     *                                  intruder cannot correlate across weeks. When
     *                                  false, hashes are stable for the app's lifetime.
     */
    public function __construct(
        #[Config('app.key')] private readonly string $appKey,
        #[Config('attribution.ip_hash_rotation', true)] private readonly bool $dailyRotation = true,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function hash(string $ip): string
    {
        $key = $this->deriveKey();

        return hash_hmac('sha256', $this->normaliseIp($ip), $key);
    }

    /**
     * {@inheritDoc}
     */
    public function anonymise(string $ip): string
    {
        // Zero the last octet on IPv4 (GDPR-approved partial
        // anonymisation) or the last 80 bits on IPv6 (RFC 7217
        // recommendation). The result is a network-block-level
        // identifier, still useful for geolocation but not
        // reversible to a single visitor.
        if (str_contains($ip, ':')) {
            return $this->anonymiseIpv6($ip);
        }

        return $this->anonymiseIpv4($ip);
    }

    /**
     * Derive today's HMAC key. When `dailyRotation` is true the key
     * incorporates today's date; otherwise it uses the raw secret.
     */
    private function deriveKey(): string
    {
        $encoded = $this->appKey;
        if (str_starts_with($encoded, 'base64:')) {
            $encoded = substr($encoded, strlen('base64:'));
        }
        $secret = base64_decode($encoded, true) ?: $this->appKey;

        if (! $this->dailyRotation) {
            return hash_hkdf('sha256', $secret, 32, 'attribution.ip-hash.v1');
        }

        $today = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->format('Y-m-d');

        return hash_hkdf('sha256', $secret, 32, "attribution.ip-hash.v1.{$today}");
    }

    /**
     * Normalize the IP before hashing. IPv6 addresses have many
     * text representations for the same address; we canonicalise
     * via `inet_pton` + `inet_ntop` so `::1` and `0:0:0:0:0:0:0:1`
     * hash to the same value.
     */
    private function normaliseIp(string $ip): string
    {
        $packed = @inet_pton($ip);
        if ($packed === false) {
            return $ip; // Malformed — hash raw so garbage still buckets consistently.
        }

        return inet_ntop($packed) ?: $ip;
    }

    /**
     * Zero the last octet on an IPv4 address.
     */
    private function anonymiseIpv4(string $ip): string
    {
        $parts = explode('.', $ip);
        if (count($parts) !== 4) {
            return $ip;
        }
        $parts[3] = '0';

        return implode('.', $parts);
    }

    /**
     * Zero the last 80 bits on an IPv6 address (keep the /48 prefix).
     */
    private function anonymiseIpv6(string $ip): string
    {
        $packed = @inet_pton($ip);
        if ($packed === false || strlen($packed) !== 16) {
            return $ip;
        }
        // Zero the last 10 bytes (80 bits) — keeps the /48 network
        // prefix intact for geolocation.
        $anonymised = substr($packed, 0, 6) . str_repeat("\0", 10);

        return inet_ntop($anonymised) ?: $ip;
    }
}
