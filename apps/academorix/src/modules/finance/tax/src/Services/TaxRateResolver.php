<?php

declare(strict_types=1);

namespace Stackra\Tax\Services;

use Stackra\Tax\Contracts\Data\TaxRateInterface;
use Stackra\Tax\Contracts\Repositories\TaxRateRepositoryInterface;
use Stackra\Tax\Contracts\Services\TaxRateResolverInterface;
use Stackra\Tax\Models\TaxRate;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

/**
 * Reference implementation of
 * {@see \Stackra\Tax\Contracts\Services\TaxRateResolverInterface}.
 *
 * Query strategy:
 *   `SELECT * FROM tax_rates WHERE tenant_id = ? AND jurisdiction_id = ?
 *     AND category = ? AND effective_from <= ?
 *     AND (effective_to IS NULL OR effective_to > ?)
 *   ORDER BY effective_from DESC LIMIT 1`
 *
 * The `effective_to IS NULL` branch handles open-ended rates
 * (current active rate has no scheduled end). The DESC sort +
 * LIMIT 1 handles jurisdictions that pre-authored future
 * rate changes.
 *
 * Cached in Redis with 6h TTL keyed on the tuple + rate row's id
 * — a rate change that hasn't reached its `effective_from` yet
 * won't be visible until the TTL expires OR the cache is manually
 * flushed. Deployments that need sub-6h propagation call
 * `tax:rate-cache-flush` (see console commands).
 *
 * `#[Scoped]` — reads active tenant scope through injected repo.
 *
 * @category Tax
 *
 * @since    0.1.0
 */
#[Scoped]
final class TaxRateResolver implements TaxRateResolverInterface
{
    /**
     * Cache TTL for rate lookups. Six hours balances staleness
     * against DB load — most tenants make hundreds of tax lookups
     * per hour across bulk-billing runs.
     */
    private const int CACHE_TTL_SECONDS = 21600;

    /**
     * Cache-key prefix. Keeps every rate lookup under a single
     * namespace so `Cache::tags(['tax_rates'])->flush()` clears
     * the whole set on catalogue changes.
     */
    private const string CACHE_KEY_PREFIX = 'tax:rate:';

    public function __construct(
        private readonly TaxRateRepositoryInterface $rates,
        #[Cache(store: 'redis')] private readonly CacheRepository $cache,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(
        string $tenantId,
        string $jurisdictionId,
        \DateTimeImmutable $date,
        string $category = 'standard',
    ): ?TaxRate {
        $cacheKey = $this->cacheKey($tenantId, $jurisdictionId, $date, $category);

        /** @var TaxRate|null $rate */
        $rate = $this->cache->remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($tenantId, $jurisdictionId, $date, $category): ?TaxRate {
            return $this->rates
                ->getModel()
                ->newQuery()
                ->where(TaxRateInterface::ATTR_TENANT_ID, $tenantId)
                ->where(TaxRateInterface::ATTR_TAX_JURISDICTION_ID, $jurisdictionId)
                ->where(TaxRateInterface::ATTR_RATE_TYPE, $category)
                ->where(TaxRateInterface::ATTR_EFFECTIVE_FROM, '<=', $date)
                ->where(function ($q) use ($date): void {
                    $q->whereNull(TaxRateInterface::ATTR_EFFECTIVE_TO)
                        ->orWhere(TaxRateInterface::ATTR_EFFECTIVE_TO, '>', $date);
                })
                ->orderByDesc(TaxRateInterface::ATTR_EFFECTIVE_FROM)
                ->first();
        });

        return $rate;
    }

    /**
     * Cache-key builder. Bucketed on YYYY-MM so distinct dates
     * within the same calendar month share a cache entry — for
     * every transaction on 2026-11-*, one lookup per rate row.
     * This trades a tiny risk of stale cache at the month boundary
     * for a massive drop in cache thrash.
     */
    private function cacheKey(string $tenantId, string $jurisdictionId, \DateTimeImmutable $date, string $category): string
    {
        return self::CACHE_KEY_PREFIX
            . $tenantId . ':'
            . $jurisdictionId . ':'
            . $date->format('Y-m') . ':'
            . $category;
    }
}
