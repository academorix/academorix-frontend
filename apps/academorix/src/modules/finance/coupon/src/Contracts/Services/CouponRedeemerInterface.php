<?php

declare(strict_types=1);

namespace Stackra\Coupon\Contracts\Services;

use Stackra\Coupon\Models\CouponRedemption;
use Stackra\Coupon\Services\CouponRedeemer;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the coupon redemption service.
 *
 * Owns the WRITE path — the only place a `coupon_redemptions` row
 * is inserted AND `coupons.usage_count` is incremented. Both writes
 * happen inside a single DB transaction with a `SELECT ... FOR UPDATE`
 * lock on the coupon row so concurrent redemptions cannot exceed
 * `usage_cap`.
 *
 * Consumers (finance::invoice, membership) call `redeem()` inside
 * their own invoice/membership creation transaction — the redeemer
 * detects an active outer transaction and joins it, giving the
 * caller atomic invoice-plus-redemption commit semantics.
 *
 * Concrete: {@see CouponRedeemer}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(CouponRedeemer::class)]
interface CouponRedeemerInterface
{
    /**
     * Redeem a coupon by code.
     *
     * Fails-closed via exception when the redemption cannot be
     * committed — the exception hierarchy under
     * `Stackra\Coupon\Exceptions` maps 1:1 to the refusal
     * reasons in `blueprints/coupon/errors.json`. Callers should
     * expect to translate the exception into a `CouponRedemptionRefused`
     * event before rethrowing when they need graceful failure
     * (pre-order preview flow, chatbot).
     *
     * Fires `CouponRedeemed` on success.
     *
     * @param  string  $tenantId           Owning tenant.
     * @param  string  $code               The user-typed redemption code.
     * @param  string  $customerType       `user` or `athlete`.
     * @param  string  $customerId         Redeeming customer.
     * @param  string  $redeemedByUserId   User initiating the redemption
     *                                     (may differ from customer — parent
     *                                     paying for a child athlete).
     * @param  string  $appliedToType      `invoice`, `membership`, or `transaction`.
     * @param  string  $appliedToId        Target row id.
     * @param  int     $sourceAmountCents  Pre-discount amount.
     * @param  string  $sourceCurrency     ISO-4217 currency.
     * @param  string|null $planId         Membership plan id (when applied
     *                                     to a plan-eligible order).
     *
     * @throws \Stackra\Coupon\Exceptions\CouponNotFoundException
     * @throws \Stackra\Coupon\Exceptions\CouponInactiveException
     * @throws \Stackra\Coupon\Exceptions\CouponExpiredException
     * @throws \Stackra\Coupon\Exceptions\CouponUsageCapReachedException
     * @throws \Stackra\Coupon\Exceptions\CouponCustomerLimitReachedException
     * @throws \Stackra\Coupon\Exceptions\CouponApplicabilityMismatchException
     * @throws \Stackra\Coupon\Exceptions\CouponMinimumOrderNotMetException
     * @throws \Stackra\Coupon\Exceptions\CouponCurrencyMismatchException
     * @throws \Stackra\Coupon\Exceptions\CouponAlreadyRedeemedOnTargetException
     *
     * @return CouponRedemption The freshly-persisted redemption row.
     */
    public function redeem(
        string $tenantId,
        string $code,
        string $customerType,
        string $customerId,
        string $redeemedByUserId,
        string $appliedToType,
        string $appliedToId,
        int $sourceAmountCents,
        string $sourceCurrency,
        ?string $planId = null,
    ): CouponRedemption;

    /**
     * Reverse a previously-committed redemption (admin correction path).
     *
     * Sets `reversed_at`, `reversed_by_user_id`, `clawback_reason`, and
     * decrements the parent coupon's `usage_count`. Fires
     * `CouponRedemptionReversed`.
     *
     * Distinct from `ClawbackHandler::process()` — clawbacks originate
     * from a finance refund cascade; reversals are manual admin corrections.
     *
     * @param  string  $tenantId          Owning tenant.
     * @param  string  $redemptionId      Redemption to reverse.
     * @param  string  $reversedByUserId  Admin performing the reversal.
     * @param  string  $reason            Free-form reason (audit trail).
     *
     * @throws \Stackra\Coupon\Exceptions\CouponRedemptionNotFoundException
     * @throws \Stackra\Coupon\Exceptions\CouponRedemptionAlreadyReversedException
     *
     * @return CouponRedemption The updated redemption row.
     */
    public function reverse(
        string $tenantId,
        string $redemptionId,
        string $reversedByUserId,
        string $reason,
    ): CouponRedemption;

    /**
     * Compute a preview of the redemption WITHOUT persisting anything.
     *
     * Used by the `POST /coupons/{code}/preview` endpoint — customers
     * see the hypothetical discount before hitting `create invoice`
     * and committing.
     *
     * @param  string       $tenantId
     * @param  string       $code
     * @param  string       $customerType
     * @param  string       $customerId
     * @param  int          $sourceAmountCents
     * @param  string       $sourceCurrency
     * @param  string|null  $planId
     *
     * @return array{
     *     is_applicable: bool,
     *     refusal_reason: ?string,
     *     discount_amount_cents: int,
     *     final_amount_cents: int,
     *     discount_snapshot: array<string, mixed>|null,
     * }
     */
    public function preview(
        string $tenantId,
        string $code,
        string $customerType,
        string $customerId,
        int $sourceAmountCents,
        string $sourceCurrency,
        ?string $planId = null,
    ): array;
}
