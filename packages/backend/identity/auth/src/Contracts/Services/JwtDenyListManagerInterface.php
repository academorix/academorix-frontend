<?php

declare(strict_types=1);

namespace Academorix\Auth\Contracts\Services;

use Academorix\Auth\Services\JwtDenyListManager;
use Illuminate\Container\Attributes\Bind;

/**
 * Deny-list manager for the HS256 inter-service JWTs.
 *
 * A JWT's natural expiry is the primary revocation clock; the
 * deny-list is the escape hatch for the "revoke now" case —
 * password reset, compromise report, security-team veto. Every
 * verifier consults the deny-list on every request, so lookup
 * MUST be O(1) — the concrete backs off to a Redis-cached hit
 * before touching the `auth_jwt_deny_lists` table.
 *
 * Deny entries expire when the underlying JWT would naturally
 * expire; there's no point remembering a jti past its `exp`.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Bind(JwtDenyListManager::class)]
interface JwtDenyListManagerInterface
{
    /**
     * Add a `jti` to the deny-list.
     *
     * @param  string  $jti     JWT's `jti` claim. RFC 7519 UUID.
     * @param  int     $ttlSec  Seconds until the corresponding JWT
     *   would naturally expire. The deny-list entry expires at the
     *   same instant, so long-expired revocations don't accumulate.
     * @param  string  $reason  Free-form operator note stored on
     *   the DB row. Kept short — `logout`, `mfa_reset`,
     *   `security_incident_#1234`, etc.
     */
    public function deny(string $jti, int $ttlSec, string $reason = 'revoked'): void;

    /**
     * Check whether a `jti` is deny-listed.
     *
     * @param  string  $jti  JWT's `jti` claim.
     *
     * @return bool  True when the jti is deny-listed AND the entry
     *   has not yet expired. The check hits Redis first; on cache
     *   miss it falls back to the DB and back-fills the cache.
     */
    public function contains(string $jti): bool;

    /**
     * Prune deny-list rows whose entries have expired.
     *
     * Called from the daily scheduled task; NOT called from the
     * hot verify path. Returns the number of rows removed for
     * observability.
     */
    public function pruneExpired(): int;
}
