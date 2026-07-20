<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

use Academorix\Coupon\Contracts\Services\CouponRedeemerInterface;
use Academorix\Coupon\Data\Requests\PreviewCouponRequestData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/coupons/{code}/preview` — compute the discount preview.
 *
 * Read-only preview — the redeemer's `preview()` NEVER inserts a
 * `coupon_redemptions` row. Rate-limited via `coupon.rate_limit`.
 *
 * Response payload:
 *
 * ```
 * {
 *   "is_applicable":         bool,
 *   "refusal_reason":        string|null,
 *   "discount_amount_cents": int,
 *   "final_amount_cents":    int,
 *   "discount_snapshot":     object|null
 * }
 * ```
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.preview.preview')]
#[Post('/api/v1/coupons/{code}/preview')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'coupon.rate_limit'])]
final class PreviewAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedeemerInterface $redeemer,
    ) {
    }

    /**
     * Preview the redemption of `$code` for the caller's cart context.
     *
     * @param  Request                    $request  Carrier of the resolved tenant id.
     * @param  string                     $code     Coupon code being previewed.
     * @param  PreviewCouponRequestData   $data     Cart context (customer, amount, currency).
     *
     * @return JsonResponse  `200 OK` with the preview payload — never `404`
     *                       even when the coupon doesn't exist: the caller
     *                       gets `is_applicable: false` + a refusal reason.
     */
    public function __invoke(Request $request, string $code, PreviewCouponRequestData $data): JsonResponse
    {
        $tenantId = (string) $request->attributes->get('tenant_id', '');

        $preview = $this->redeemer->preview(
            tenantId: $tenantId,
            code: $code,
            customerType: $data->customerType,
            customerId: $data->customerId,
            sourceAmountCents: $data->sourceAmountCents,
            sourceCurrency: $data->sourceCurrency,
            planId: $data->targetPlanId,
        );

        return response()->json($preview);
    }
}
