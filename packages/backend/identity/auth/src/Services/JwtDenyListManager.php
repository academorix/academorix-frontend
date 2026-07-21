<?php

declare(strict_types=1);

namespace Stackra\Auth\Services;

use Stackra\Auth\Contracts\Data\AuthJwtDenyListInterface;
use Stackra\Auth\Contracts\Repositories\AuthJwtDenyListRepositoryInterface;
use Stackra\Auth\Contracts\Services\JwtDenyListManagerInterface;
use DateTimeImmutable;
use Illuminate\Container\Attributes\Cache as CacheAttr;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

/**
 * Deny-list manager for revoked HS256 JWTs.
 *
 * Two-tier lookup path — Redis-cached membership first
 * (`Cache::has()` on `auth:jwt:deny:<jti>`), DB row second on
 * cache miss. Positive DB hits back-fill the cache with a TTL that
 * matches the row's `expires_at`. Negative DB hits do NOT cache —
 * a negative cache would risk shadowing a subsequent deny call.
 *
 * The manager consciously does NOT emit an event on `deny()` —
 * the surrounding flow already fires higher-level events like
 * `SessionRevoked` / `TokenRevoked` that carry richer context.
 * Chaining events at this layer just doubles the noise.
 *
 * `#[Scoped]` because the manager touches request-bound tenant
 * scope through the repository. A singleton would cache the
 * boot-time DB connection, which is safe today but not
 * future-proof.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[Scoped]
final class JwtDenyListManager implements JwtDenyListManagerInterface
{
    /**
     * Redis cache-key prefix. All deny entries live under one
     * namespace so an incident responder can walk them with
     * `KEYS auth:jwt:deny:*` when triaging a compromise.
     */
    private const string CACHE_KEY_PREFIX = 'auth:jwt:deny:';

    /**
     * @param  AuthJwtDenyListRepositoryInterface  $repo   Persistence boundary.
     * @param  CacheRepository                     $cache  Redis (or configured store) — sub-ms hit path.
     */
    public function __construct(
        private readonly AuthJwtDenyListRepositoryInterface $repo,
        #[CacheAttr('redis')]
        private readonly CacheRepository $cache,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function deny(string $jti, int $ttlSec, string $reason = 'revoked'): void
    {
        // A zero or negative TTL means the JWT would already be
        // expired — no point storing the deny entry, natural expiry
        // will do the same job. Log-only.
        if ($ttlSec <= 0) {
            return;
        }

        $now = new DateTimeImmutable();
        $expiresAt = $now->modify('+' . $ttlSec . ' seconds');

        // Idempotent insert — an already-denied jti is a no-op
        // rather than a unique constraint hit. The unique key on
        // `auth_jwt_deny_lists(jti)` guards against duplicate rows.
        $this->repo->query()->updateOrCreate(
            [AuthJwtDenyListInterface::ATTR_JTI => $jti],
            [
                AuthJwtDenyListInterface::ATTR_REASON => $reason,
                AuthJwtDenyListInterface::ATTR_REVOKED_AT => $now,
                AuthJwtDenyListInterface::ATTR_EXPIRES_AT => $expiresAt,
            ],
        );

        // Warm the cache with the exact TTL the row carries. When
        // the JWT would naturally expire, so does the cache entry
        // — no manual cleanup required.
        $this->cache->put(self::CACHE_KEY_PREFIX . $jti, true, $ttlSec);
    }

    /**
     * {@inheritDoc}
     */
    public function contains(string $jti): bool
    {
        $cacheKey = self::CACHE_KEY_PREFIX . $jti;

        // Fast path — Redis hit. `has()` distinguishes "cached
        // true" from "cached false" from "missing"; we only care
        // about existence here.
        if ($this->cache->has($cacheKey)) {
            return true;
        }

        // Slow path — table hit. Filter on the jti + non-expired
        // window; the DB primary key on `jti` makes this O(1).
        $row = $this->repo->query()
            ->where(AuthJwtDenyListInterface::ATTR_JTI, $jti)
            ->where(AuthJwtDenyListInterface::ATTR_EXPIRES_AT, '>', now())
            ->first();

        if ($row === null) {
            // Deliberately NO negative caching — see class docblock.
            return false;
        }

        // Positive back-fill so the next verify hits Redis instead
        // of the DB. Cache TTL matches the row's remaining lifetime
        // so the cache never survives past the JWT's natural exp.
        $remainingSec = max(1, ((int) $row->getAttribute(AuthJwtDenyListInterface::ATTR_EXPIRES_AT)->getTimestamp()) - time());
        $this->cache->put($cacheKey, true, $remainingSec);

        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function pruneExpired(): int
    {
        // Prune only rows whose expires_at is definitively past;
        // the cache entries with those TTLs have already timed out
        // in Redis, so no cache invalidation is required.
        return $this->repo->query()
            ->where(AuthJwtDenyListInterface::ATTR_EXPIRES_AT, '<=', now())
            ->delete();
    }
}
