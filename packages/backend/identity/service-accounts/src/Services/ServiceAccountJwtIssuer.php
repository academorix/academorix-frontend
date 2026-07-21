<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Services;

use Stackra\Auth\Contracts\Services\JwtSignerInterface;
use Stackra\Auth\Data\JwtPayloadData;
use Stackra\Auth\Data\SignedJwtData;
use Stackra\Auth\Enums\JwtPayloadPurpose;
use Stackra\ServiceAccounts\Contracts\Data\ServiceAccountInterface;
use Stackra\ServiceAccounts\Contracts\Services\ServiceAccountJwtIssuerInterface;
use Stackra\ServiceAccounts\Events\ServiceAccountJwtIssued;
use Stackra\ServiceAccounts\Models\ServiceAccount;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * Bridges {@see ServiceAccount} rows to `stackra/auth`'s HS256
 * signer.
 *
 * ## Payload shape (blueprint §8.2)
 *
 *   - `iss`     — the configured issuer URL.
 *   - `aud`     — caller-supplied downstream services.
 *   - `sub`     — the SA's ULID (`svc_...`).
 *   - `app`     — the SA's `application_id`.
 *   - `tid`     — the SA's `tenant_id` (OMITTED entirely when null;
 *                 the schema treats platform-plane SAs as "no
 *                 tid" rather than "tid: null").
 *   - `iat/exp` — issued now, expires after the resolved TTL.
 *   - `jti`     — a fresh UUID per issuance (deny-list key).
 *   - `kid`     — the SA's own `signer_kid` — per-account
 *                 revocation isolation.
 *   - `purpose` — always `service_account`.
 *   - `roles`   — a single `service_account:<name>` role for
 *                 traceability.
 *   - `permissions` — caller-supplied compact permissions.
 *
 * The issuer fires {@see ServiceAccountJwtIssued} after signing so
 * observability + the last-used-at back-fill job pick it up.
 *
 * `#[Scoped]` — reaches request-bound tenant context through the
 * SA row's tenant_id.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[Scoped]
final class ServiceAccountJwtIssuer implements ServiceAccountJwtIssuerInterface
{
    /**
     * @param  JwtSignerInterface  $signer            HS256 signer.
     * @param  Dispatcher          $events            Fires `ServiceAccountJwtIssued`.
     * @param  string              $issuer            Fully-qualified issuer URL from config.
     * @param  int                 $defaultTtl        Default TTL for exchange-issued JWTs (blueprint = 300).
     * @param  int                 $maxTtl            Hard cap on TTL — refuses caller overrides above this.
     */
    public function __construct(
        private readonly JwtSignerInterface $signer,
        private readonly Dispatcher $events,
        #[Config('auth.jwt.issuer', 'https://identity.stackra.com')]
        private readonly string $issuer = 'https://identity.stackra.com',
        #[Config('service-accounts.jwt.ttl_seconds', 300)]
        private readonly int $defaultTtl = 300,
        #[Config('service-accounts.jwt.max_ttl_seconds', 3600)]
        private readonly int $maxTtl = 3600,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function issue(
        ServiceAccount $account,
        array $audiences,
        ?int $ttlSeconds = null,
        ?array $permissions = null,
        string $trigger = 'exchange',
    ): SignedJwtData {
        // Resolve TTL — either caller override (bounded by maxTtl)
        // or the module default. Zero / negative TTLs collapse to
        // the default so downstream code never sees a bogus exp.
        $ttl = $ttlSeconds !== null && $ttlSeconds > 0
            ? min($ttlSeconds, $this->maxTtl)
            : $this->defaultTtl;

        $now = time();
        $jti = self::freshJti();

        $applicationId = (string) $account->getAttribute(ServiceAccountInterface::ATTR_APPLICATION_ID);
        $tenantId = $account->getAttribute(ServiceAccountInterface::ATTR_TENANT_ID);
        $signerKid = (string) $account->getAttribute(ServiceAccountInterface::ATTR_SIGNER_KID);
        $subject = (string) $account->getKey();

        // The SA's role name is derived from its `name` column so
        // downstream services can differentiate `ai_service_reader`
        // from `webhook_ingestor` without an extra lookup.
        $roleName = 'service_account:' . (string) $account->getAttribute(ServiceAccountInterface::ATTR_NAME);

        $payload = new JwtPayloadData(
            iss: $this->issuer,
            aud: array_values(array_map(strval(...), $audiences)),
            sub: $subject,
            app: $applicationId,
            iat: $now,
            exp: $now + $ttl,
            kid: $signerKid,
            jti: $jti,
            purpose: JwtPayloadPurpose::ServiceAccount,
            // Platform-plane SAs omit `tid` — blueprint invariant.
            tid: is_string($tenantId) ? $tenantId : null,
            // Empty sco for SAs — they never carry org/branch scope.
            sco: null,
            roles: [$roleName],
            permissions: $permissions !== null
                ? array_values(array_map(strval(...), $permissions))
                : null,
        );

        $signed = $this->signer->sign($payload);

        // Event fires AFTER the token exists — no partial-write
        // risk. Downstream listeners:
        //   - UpdateLastUsedTimestampJob (queue = default) — back-
        //     fills service_accounts.last_used_at.
        //   - Observability sink — increments the issuance counter
        //     tagged by trigger ('exchange' vs 'test').
        // The event carries public JWT metadata only — never the
        // encoded token itself.
        $this->events->dispatch(new ServiceAccountJwtIssued(
            serviceAccountId: $subject,
            applicationId: $applicationId,
            kid: $signerKid,
            aud: implode(',', $payload->aud),
            issuedTtlSeconds: $ttl,
            jti: $jti,
            trigger: $trigger,
            issuedAt: gmdate('c', $now),
        ));

        return $signed;
    }

    /**
     * Generate a fresh UUIDv4 for the `jti` claim.
     *
     * Uses `random_bytes()` (CSPRNG) so no two issuances collide
     * within a nanosecond. Formatted per RFC 4122 §4.4.
     */
    private static function freshJti(): string
    {
        $bytes = random_bytes(16);

        // Set version (4) and variant (10xx) bits per RFC 4122.
        $bytes[6] = chr((ord($bytes[6]) & 0x0F) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3F) | 0x80);

        $hex = bin2hex($bytes);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12),
        );
    }
}
