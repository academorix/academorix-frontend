<?php

declare(strict_types=1);

namespace Academorix\Compliance\Services;

use Academorix\Compliance\Contracts\Repositories\ConsentRecordRepositoryInterface;
use Academorix\Compliance\Contracts\Services\ConsentGateInterface;
use Academorix\Compliance\Enums\ConsentDecision;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Cache\Repository;

/**
 * Default consent-gate implementation.
 *
 * Cache-wrapped read of the latest consent decision. TTL comes from
 * `compliance.consent.cache_ttl_seconds`; invalidation happens in
 * {@see \Academorix\Compliance\Observers\ConsentRecordObserver}.
 *
 * `#[Scoped]` — the cache repository is bound per-request; sharing
 * as `#[Singleton]` would leak the request-scoped store between
 * tenants.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultConsentGate implements ConsentGateInterface
{
    public function __construct(
        private readonly ConsentRecordRepositoryInterface $records,
        #[Cache] private readonly Repository $cache,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $subjectType, string $subjectId, string $category): bool
    {
        $key = $this->cacheKey($subjectType, $subjectId, $category);
        $ttl = (int) \config('compliance.consent.cache_ttl_seconds', 300);

        return (bool) $this->cache->remember($key, $ttl, function () use ($subjectType, $subjectId, $category): bool {
            $latest = $this->records->findLatestFor($subjectType, $subjectId, $category);

            if ($latest === null) {
                return false;
            }

            $decision = $latest->{\Academorix\Compliance\Contracts\Data\ConsentRecordInterface::ATTR_DECISION};
            $value    = $decision instanceof ConsentDecision ? $decision->value : (string) $decision;

            return $value === ConsentDecision::Granted->value;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function flush(string $subjectType, string $subjectId): void
    {
        // Without tagged caches (test drivers use array) we cannot
        // wildcard-invalidate; the observer receives every category
        // in scope and calls flush per-record instead.
        $this->cache->forget($this->cacheKey($subjectType, $subjectId, '*'));
    }

    /**
     * Compute the cache key for one consent tuple.
     */
    private function cacheKey(string $subjectType, string $subjectId, string $category): string
    {
        return \sprintf(
            'compliance:consent:%s:%s:%s',
            \str_replace('\\', '.', $subjectType),
            $subjectId,
            $category,
        );
    }
}
