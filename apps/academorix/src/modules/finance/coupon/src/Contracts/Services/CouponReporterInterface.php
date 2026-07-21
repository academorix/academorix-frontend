<?php

declare(strict_types=1);

namespace Stackra\Coupon\Contracts\Services;

use Stackra\Coupon\Services\CouponReporter;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the coupon usage reporter.
 *
 * Produces the per-tenant weekly usage rollup consumed by
 * `GET /api/v1/coupons/report` — coupons issued, coupons redeemed,
 * total discount cents, clawback count, top campaign codes,
 * per-issuance_source breakdown.
 *
 * Reports are advisory; consumers persist their own rendered artefacts
 * (CSV, PDF) via `GenerateCouponUsageReportJob` on top of this service.
 *
 * Concrete: {@see CouponReporter}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(CouponReporter::class)]
interface CouponReporterInterface
{
    /**
     * Compute the tenant's coupon usage report over `[$periodStart, $periodEnd)`.
     *
     * @param  string             $tenantId    Owning tenant.
     * @param  \DateTimeInterface $periodStart Inclusive lower bound.
     * @param  \DateTimeInterface $periodEnd   Exclusive upper bound.
     *
     * @return array{
     *     tenant_id: string,
     *     period_start: string,
     *     period_end: string,
     *     coupons_issued: int,
     *     coupons_active: int,
     *     redemptions_committed: int,
     *     redemptions_reversed: int,
     *     total_discount_cents: int,
     *     total_source_amount_cents: int,
     *     clawback_count: int,
     *     by_issuance_source: array<string, array{count: int, discount_cents: int}>,
     *     top_campaigns: list<array{campaign_name: string, redemption_count: int, discount_cents: int}>,
     * }
     */
    public function report(
        string $tenantId,
        \DateTimeInterface $periodStart,
        \DateTimeInterface $periodEnd,
    ): array;
}
