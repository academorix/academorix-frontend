<?php

declare(strict_types=1);

namespace Academorix\Coupon\Contracts\Services;

use Academorix\Coupon\Models\CouponRedemption;
use Academorix\Coupon\Services\ClawbackHandler;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the coupon clawback handler.
 *
 * Owns the write path for reversing a coupon redemption in response
 * to a finance-side reversal (refund, chargeback, fraud flag).
 *
 * Distinct from `CouponRedeemer::reverse()` — that method is the
 * admin correction path. This service is what
 * `ProcessCouponClawbackJob` calls when a Finance module event fires
 * (`InvoiceRefunded`, `ChargebackFiled`).
 *
 * Fires `CouponClawbackCompleted` on success.
 *
 * Concrete: {@see ClawbackHandler}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(ClawbackHandler::class)]
interface ClawbackHandlerInterface
{
    /**
     * Process a clawback for a single redemption.
     *
     * @param  string  $tenantId            Owning tenant.
     * @param  string  $redemptionId        Redemption to claw back.
     * @param  string  $clawbackReason      `refund` / `chargeback` / `fraud` / `manual_admin`.
     * @param  string  $triggeringEventId   Finance event id that initiated the clawback.
     *
     * @throws \Academorix\Coupon\Exceptions\CouponRedemptionNotFoundException
     * @throws \Academorix\Coupon\Exceptions\CouponRedemptionAlreadyReversedException
     * @throws \Academorix\Coupon\Exceptions\CouponClawbackFailedException
     *
     * @return CouponRedemption The reversed redemption row.
     */
    public function process(
        string $tenantId,
        string $redemptionId,
        string $clawbackReason,
        string $triggeringEventId,
    ): CouponRedemption;
}
