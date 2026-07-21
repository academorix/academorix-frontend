<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

use Academorix\Coupon\Contracts\Services\CouponReporterInterface;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/coupons/report` — weekly usage rollup.
 *
 * Returns a synchronous per-tenant report (fast for `<= 7d` windows).
 * For longer ranges the response includes a signed S3 URL that
 * `GenerateCouponUsageReportJob` populates asynchronously.
 *
 * Query params:
 *   period_start (ISO-8601, optional; default = 7d ago)
 *   period_end   (ISO-8601, optional; default = now)
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.report.list')]
#[Get('/api/v1/coupons/report')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ListReportAction
{
    use AsController;

    public function __construct(
        private readonly CouponReporterInterface $reporter,
    ) {
    }

    /**
     * Compute the report for the tenant + requested window.
     *
     * @param  Request  $request  Carrier of the resolved tenant id.
     *
     * @return JsonResponse  The rollup payload.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');

        $now = new \DateTimeImmutable();
        $defaultStart = $now->sub(new \DateInterval('P7D'));

        $periodStart = $this->parseDate($request->string('period_start')->toString(), $defaultStart);
        $periodEnd = $this->parseDate($request->string('period_end')->toString(), $now);

        $report = $this->reporter->report(
            tenantId: $tenantId,
            periodStart: $periodStart,
            periodEnd: $periodEnd,
        );

        return response()->json($report);
    }

    /**
     * Coerce an ISO-8601 string to a `DateTimeImmutable`, falling back to
     * `$default` when the input is empty or unparseable.
     */
    private function parseDate(string $raw, \DateTimeImmutable $default): \DateTimeImmutable
    {
        if ($raw === '') {
            return $default;
        }

        try {
            return new \DateTimeImmutable($raw);
        } catch (\Throwable) {
            return $default;
        }
    }
}
