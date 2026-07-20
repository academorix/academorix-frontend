<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

use Academorix\Coupon\Contracts\Services\CouponIssuerInterface;
use Academorix\Coupon\Data\CouponData;
use Academorix\Coupon\Data\Requests\BulkIssueCouponRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

/**
 * `POST /api/v1/coupons/bulk-issue` — generate N unique coupon codes.
 *
 * Medium+ tier gate (`entitlement.enforce:coupon_bulk_issue` — declared
 * on the route group at boot). Every generated row shares the `template`
 * config; the code portion is generated per row by `CodeGenerator`.
 *
 * Response: `201 Created` with a JSON array of the freshly-issued
 * coupons, wrapped in Spatie Data collection semantics for
 * cross-package consistency.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.bulk_issue.create')]
#[Post('/api/v1/coupons/bulk-issue')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'entitlement.enforce:coupon_bulk_issue'])]
final class CreateBulkIssueAction
{
    use AsController;

    public function __construct(
        private readonly CouponIssuerInterface $issuer,
    ) {
    }

    /**
     * Bulk-issue coupons for the caller's tenant.
     *
     * @param  Request                        $request  Carrier of the resolved tenant id + auth user.
     * @param  BulkIssueCouponRequestData    $data     Bulk-issue payload.
     *
     * @return JsonResponse  `201` with the collection of created coupons.
     */
    public function __invoke(Request $request, BulkIssueCouponRequestData $data): JsonResponse
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        $createdBy = (string) ($request->user()?->getAuthIdentifier() ?? '');

        $issued = $this->issuer->bulkIssue(
            tenantId: $tenantId,
            createdBy: $createdBy,
            count: $data->count,
            template: $data->template,
            codePrefix: $data->codePrefix,
            codeLength: $data->codeLength,
            campaignName: $data->campaignName,
        );

        return response()->json(
            CouponData::collect($issued, DataCollection::class),
            JsonResponse::HTTP_CREATED,
        );
    }
}
