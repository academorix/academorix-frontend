<?php

declare(strict_types=1);

namespace Academorix\Coupon\Services;

use Academorix\Coupon\Contracts\Data\CouponInterface;
use Academorix\Coupon\Contracts\Data\CouponRedemptionInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Academorix\Coupon\Contracts\Services\CouponReporterInterface;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * Reference implementation of
 * {@see \Academorix\Coupon\Contracts\Services\CouponReporterInterface}.
 *
 * Read-only aggregation over `coupons` + `coupon_redemptions` for a
 * given tenant over a `[periodStart, periodEnd)` window. Consumed
 * synchronously by the weekly usage-report endpoint AND async by
 * `GenerateCouponUsageReportJob` (which renders the CSV/PDF, writes
 * to S3, and dispatches `CouponReportGenerated`).
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class CouponReporter implements CouponReporterInterface
{
    public function __construct(
        private readonly CouponRepositoryInterface $coupons,
        private readonly CouponRedemptionRepositoryInterface $redemptions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function report(
        string $tenantId,
        \DateTimeInterface $periodStart,
        \DateTimeInterface $periodEnd,
    ): array {
        // Base counters — one query each; keep them cheap.
        $couponsIssued = $this->coupons->getModel()->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->whereBetween(CouponInterface::ATTR_CREATED_AT, [$periodStart, $periodEnd])
            ->count();

        $couponsActive = $this->coupons->getModel()->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->where(CouponInterface::ATTR_IS_ACTIVE, true)
            ->count();

        $redemptions = $this->redemptions->getModel()->newQuery()
            ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
            ->whereBetween(CouponRedemptionInterface::ATTR_REDEEMED_AT, [$periodStart, $periodEnd]);

        $redemptionsCommitted = (clone $redemptions)
            ->whereNull(CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->count();

        $redemptionsReversed = (clone $redemptions)
            ->whereNotNull(CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->count();

        $totals = (clone $redemptions)
            ->whereNull(CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->selectRaw(
                'COALESCE(SUM(' . CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS . '), 0) AS total_discount, '
                . 'COALESCE(SUM(' . CouponRedemptionInterface::ATTR_SOURCE_AMOUNT_CENTS . '), 0) AS total_source',
            )
            ->first();

        // Clawbacks — filtered further to reversed-inside-window rows so a
        // reversal that happened AFTER the window doesn't inflate the count.
        $clawbacks = $this->redemptions->getModel()->newQuery()
            ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
            ->whereNotNull(CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->whereBetween(CouponRedemptionInterface::ATTR_REVERSED_AT, [$periodStart, $periodEnd])
            ->count();

        return [
            'tenant_id' => $tenantId,
            'period_start' => $periodStart->format(DATE_ATOM),
            'period_end' => $periodEnd->format(DATE_ATOM),
            'coupons_issued' => $couponsIssued,
            'coupons_active' => $couponsActive,
            'redemptions_committed' => $redemptionsCommitted,
            'redemptions_reversed' => $redemptionsReversed,
            'total_discount_cents' => (int) ($totals->total_discount ?? 0),
            'total_source_amount_cents' => (int) ($totals->total_source ?? 0),
            'clawback_count' => $clawbacks,
            'by_issuance_source' => $this->byIssuanceSource($tenantId, $periodStart, $periodEnd),
            'top_campaigns' => $this->topCampaigns($tenantId, $periodStart, $periodEnd),
        ];
    }

    /**
     * Group committed redemptions by the parent coupon's issuance_source.
     *
     * @return array<string, array{count: int, discount_cents: int}>
     */
    private function byIssuanceSource(
        string $tenantId,
        \DateTimeInterface $periodStart,
        \DateTimeInterface $periodEnd,
    ): array {
        $rows = $this->redemptions->getModel()->newQuery()
            ->from(
                CouponRedemptionInterface::TABLE . ' as r',
            )
            ->leftJoin(
                CouponInterface::TABLE . ' as c',
                'r.' . CouponRedemptionInterface::ATTR_COUPON_ID,
                '=',
                'c.' . CouponInterface::ATTR_ID,
            )
            ->where('r.' . CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
            ->whereNull('r.' . CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->whereBetween('r.' . CouponRedemptionInterface::ATTR_REDEEMED_AT, [$periodStart, $periodEnd])
            ->select(
                'c.' . CouponInterface::ATTR_ISSUANCE_SOURCE . ' as source',
                DB::raw('COUNT(*) as count'),
                DB::raw('COALESCE(SUM(r.' . CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS . '), 0) as discount_cents'),
            )
            ->groupBy('c.' . CouponInterface::ATTR_ISSUANCE_SOURCE)
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $key = (string) ($row->source ?? 'unknown');
            $out[$key] = [
                'count' => (int) $row->count,
                'discount_cents' => (int) $row->discount_cents,
            ];
        }

        return $out;
    }

    /**
     * Top-N campaigns by redemption count. Campaign name is stored on
     * `coupons.issuance_context->campaign_name` (JSON path).
     *
     * @return list<array{campaign_name: string, redemption_count: int, discount_cents: int}>
     */
    private function topCampaigns(
        string $tenantId,
        \DateTimeInterface $periodStart,
        \DateTimeInterface $periodEnd,
        int $limit = 10,
    ): array {
        // Portable JSON-path extraction — MySQL 8, PostgreSQL, SQLite (3.38+)
        // all accept `->>'$.campaign_name'` via Laravel's Grammar for JSON.
        $rows = $this->redemptions->getModel()->newQuery()
            ->from(CouponRedemptionInterface::TABLE . ' as r')
            ->leftJoin(
                CouponInterface::TABLE . ' as c',
                'r.' . CouponRedemptionInterface::ATTR_COUPON_ID,
                '=',
                'c.' . CouponInterface::ATTR_ID,
            )
            ->where('r.' . CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
            ->whereNull('r.' . CouponRedemptionInterface::ATTR_REVERSED_AT)
            ->whereBetween('r.' . CouponRedemptionInterface::ATTR_REDEEMED_AT, [$periodStart, $periodEnd])
            ->whereNotNull('c.' . CouponInterface::ATTR_ISSUANCE_CONTEXT . '->campaign_name')
            ->select(
                'c.' . CouponInterface::ATTR_ISSUANCE_CONTEXT . '->campaign_name as campaign_name',
                DB::raw('COUNT(*) as redemption_count'),
                DB::raw('COALESCE(SUM(r.' . CouponRedemptionInterface::ATTR_DISCOUNT_AMOUNT_CENTS . '), 0) as discount_cents'),
            )
            ->groupBy('c.' . CouponInterface::ATTR_ISSUANCE_CONTEXT . '->campaign_name')
            ->orderByDesc('redemption_count')
            ->limit($limit)
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[] = [
                'campaign_name' => (string) ($row->campaign_name ?? ''),
                'redemption_count' => (int) $row->redemption_count,
                'discount_cents' => (int) $row->discount_cents,
            ];
        }

        return $out;
    }
}
