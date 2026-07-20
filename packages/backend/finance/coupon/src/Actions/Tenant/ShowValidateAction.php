<?php

declare(strict_types=1);

namespace Academorix\Coupon\Actions\Tenant;

use Academorix\Coupon\Contracts\Services\CouponValidatorInterface;
use Academorix\Coupon\Data\CouponVerdictData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/coupons/validate/{code}` — pre-checkout code validation.
 *
 * Pure read — never touches the DB counter. The client hits this endpoint
 * from the cart UI when the user types a code; the response drives the
 * "code valid" / "code invalid" pill.
 *
 * Rate-limited via `coupon.rate_limit` (10/IP/hour) to prevent brute-force
 * code enumeration. When the caller does not supply an `order_amount_cents`
 * query param the validator answers on structural checks only (existence,
 * active flag, time window) — the discount preview is deferred to the
 * `POST /coupons/{code}/preview` endpoint.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.validate.show')]
#[Get('/api/v1/coupons/validate/{code}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'coupon.rate_limit'])]
final class ShowValidateAction
{
    use AsController;

    public function __construct(
        private readonly CouponValidatorInterface $validator,
    ) {
    }

    /**
     * Validate the coupon code against structural rules for the caller.
     *
     * @param  Request  $request  Carrier of the resolved tenant id + the
     *                            authenticated user (drives customer id +
     *                            optional order-amount context).
     * @param  string   $code     User-supplied redemption code — raw,
     *                            case-insensitive (the validator lowercases
     *                            before the DB match).
     *
     * @return CouponVerdictData  `{valid, reason?, coupon_id?, discount_cents,
     *                            currency?, discount_type?}` — driven by the
     *                            validator's fail-closed verdict.
     */
    public function __invoke(Request $request, string $code): CouponVerdictData
    {
        // Tenant id is resolved by the `tenant.resolve` middleware; we read
        // it from the request container instead of `tenant()` to keep the
        // action framework-agnostic.
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        $customerId = (string) ($request->user()?->getAuthIdentifier() ?? '');

        // Structural check — no order context supplied. The `preview` endpoint
        // does the amount-aware pass (currency mismatch, minimum order).
        return $this->validator->validate(
            tenantId: $tenantId,
            couponCode: $code,
            customerId: $customerId,
            orderAmountCents: (int) $request->integer('order_amount_cents', 0),
            orderCurrency: (string) $request->string('order_currency', ''),
            planId: $request->has('plan_id') ? (string) $request->string('plan_id') : null,
        );
    }
}
