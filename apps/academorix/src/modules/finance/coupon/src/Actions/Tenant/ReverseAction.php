<?php

declare(strict_types=1);

namespace Stackra\Coupon\Actions\Tenant;

use Stackra\Coupon\Contracts\Services\CouponRedeemerInterface;
use Stackra\Coupon\Data\CouponRedemptionData;
use Stackra\Coupon\Data\Requests\ReverseRedemptionRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/coupons/redemptions/{redemption}/reverse` — admin manual reversal.
 *
 * Correction path — distinct from the clawback that cascades from a
 * finance refund (handled by `ClawbackHandler` via
 * `ProcessCouponClawbackJob`).
 *
 * Fires `CouponRedemptionReversed`. Audit-critical.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[AsAction(name: 'coupon.reverse.reverse')]
#[Post('/api/v1/coupons/redemptions/{redemption}/reverse')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class ReverseAction
{
    use AsController;

    public function __construct(
        private readonly CouponRedeemerInterface $redeemer,
    ) {
    }

    /**
     * Manually reverse one redemption.
     *
     * @param  Request                        $request       Carrier of tenant + user.
     * @param  string                         $redemptionId  Row to reverse.
     * @param  ReverseRedemptionRequestData   $data          Reversal reason.
     *
     * @throws \Stackra\Coupon\Exceptions\CouponRedemptionNotFoundException
     * @throws \Stackra\Coupon\Exceptions\CouponRedemptionAlreadyReversedException
     *
     * @return CouponRedemptionData  The reversed redemption row.
     */
    public function __invoke(
        Request $request,
        string $redemptionId,
        ReverseRedemptionRequestData $data,
    ): CouponRedemptionData {
        $tenantId = (string) $request->attributes->get('tenant_id', '');
        $userId = (string) ($request->user()?->getAuthIdentifier() ?? '');

        $reversed = $this->redeemer->reverse(
            tenantId: $tenantId,
            redemptionId: $redemptionId,
            reversedByUserId: $userId,
            reason: $data->reason,
        );

        return CouponRedemptionData::from($reversed);
    }
}
