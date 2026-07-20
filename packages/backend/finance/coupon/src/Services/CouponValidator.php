<?php

declare(strict_types=1);

namespace Academorix\Coupon\Services;

use Academorix\Coupon\Contracts\Data\CouponInterface;
use Academorix\Coupon\Contracts\Data\CouponRedemptionInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRedemptionRepositoryInterface;
use Academorix\Coupon\Contracts\Repositories\CouponRepositoryInterface;
use Academorix\Coupon\Contracts\Services\CouponValidatorInterface;
use Academorix\Coupon\Data\CouponVerdictData;
use Illuminate\Container\Attributes\Scoped;

/**
 * Reference implementation of
 * {@see \Academorix\Coupon\Contracts\Services\CouponValidatorInterface}.
 *
 * Fail-closed: every branch returns a verdict; nothing bubbles.
 * The order of checks is optimised for cheap-first: existence /
 * active-flag / time-window are index lookups; the per-customer-
 * limit check does a filtered `redemptions` count last.
 *
 * `#[Scoped]` — reads active tenant scope through injected repos.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Scoped]
final class CouponValidator implements CouponValidatorInterface
{
    public function __construct(
        private readonly CouponRepositoryInterface $coupons,
        private readonly CouponRedemptionRepositoryInterface $redemptions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function validate(
        string $tenantId,
        string $couponCode,
        string $customerId,
        int $orderAmountCents,
        string $orderCurrency,
        ?string $planId = null,
    ): CouponVerdictData {
        // 1. Existence — case-insensitive match by code.
        $coupon = $this->coupons
            ->getModel()
            ->newQuery()
            ->where(CouponInterface::ATTR_TENANT_ID, $tenantId)
            ->whereRaw('lower(' . CouponInterface::ATTR_CODE . ') = ?', [strtolower(trim($couponCode))])
            ->first();
        if ($coupon === null) {
            return new CouponVerdictData(false, 'not_found');
        }

        // 2. Active flag.
        if ((bool) $coupon->getAttribute(CouponInterface::ATTR_IS_ACTIVE) !== true) {
            return new CouponVerdictData(false, 'inactive', couponId: (string) $coupon->getKey());
        }

        // 3. Time window.
        $now = new \DateTimeImmutable();
        $validFrom = $coupon->getAttribute(CouponInterface::ATTR_VALID_FROM);
        $validUntil = $coupon->getAttribute(CouponInterface::ATTR_VALID_UNTIL);
        if ($validFrom instanceof \DateTimeInterface && $now < \DateTimeImmutable::createFromInterface($validFrom)) {
            return new CouponVerdictData(false, 'not_started', couponId: (string) $coupon->getKey());
        }
        if ($validUntil instanceof \DateTimeInterface && $now >= \DateTimeImmutable::createFromInterface($validUntil)) {
            return new CouponVerdictData(false, 'expired', couponId: (string) $coupon->getKey());
        }

        // 4. Global usage cap.
        $usageCap = $coupon->getAttribute(CouponInterface::ATTR_USAGE_CAP);
        $usageCount = (int) $coupon->getAttribute(CouponInterface::ATTR_USAGE_COUNT);
        if ($usageCap !== null && $usageCount >= (int) $usageCap) {
            return new CouponVerdictData(false, 'usage_cap_reached', couponId: (string) $coupon->getKey());
        }

        // 5. Currency match (only for `fixed_amount` coupons — a
        //    percentage coupon works across any currency).
        $discountType = (string) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_TYPE);
        $discountAmount = (float) $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_AMOUNT);
        $couponCurrency = $coupon->getAttribute(CouponInterface::ATTR_DISCOUNT_CURRENCY);
        if ($discountType === 'fixed_amount'
            && is_string($couponCurrency)
            && strtolower($couponCurrency) !== strtolower($orderCurrency)
        ) {
            return new CouponVerdictData(false, 'currency_mismatch', couponId: (string) $coupon->getKey());
        }

        // 6. Minimum order value.
        $minAmount = $coupon->getAttribute(CouponInterface::ATTR_MINIMUM_ORDER_AMOUNT);
        if ($minAmount !== null && $orderAmountCents < (int) $minAmount) {
            return new CouponVerdictData(false, 'minimum_order_not_met', couponId: (string) $coupon->getKey());
        }

        // 7. Plan applicability.
        if ($planId !== null) {
            $applicability = (string) $coupon->getAttribute(CouponInterface::ATTR_APPLICABILITY);
            if ($applicability === 'specific_plans') {
                $planIds = (array) $coupon->getAttribute(CouponInterface::ATTR_APPLICABLE_PLAN_IDS);
                if (! in_array($planId, $planIds, true)) {
                    return new CouponVerdictData(false, 'plan_not_applicable', couponId: (string) $coupon->getKey());
                }
            }
        }

        // 8. Per-customer redemption limit — cheapest last (single
        //    filtered count).
        $perCustomerLimit = $coupon->getAttribute(CouponInterface::ATTR_PER_CUSTOMER_LIMIT);
        if ($perCustomerLimit !== null) {
            $existing = $this->redemptions
                ->getModel()
                ->newQuery()
                ->where(CouponRedemptionInterface::ATTR_TENANT_ID, $tenantId)
                ->where(CouponRedemptionInterface::ATTR_COUPON_ID, $coupon->getKey())
                ->where(CouponRedemptionInterface::ATTR_CUSTOMER_ID, $customerId)
                ->count();
            if ($existing >= (int) $perCustomerLimit) {
                return new CouponVerdictData(false, 'per_customer_limit_reached', couponId: (string) $coupon->getKey());
            }
        }

        // 9. Compute the discount amount.
        $discountCents = $discountType === 'percentage'
            ? min((int) round($orderAmountCents * $discountAmount / 100.0, mode: PHP_ROUND_HALF_EVEN), $orderAmountCents)
            : (int) $discountAmount;

        return new CouponVerdictData(
            valid: true,
            couponId: (string) $coupon->getKey(),
            discountCents: $discountCents,
            currency: is_string($couponCurrency) ? $couponCurrency : $orderCurrency,
            discountType: $discountType,
        );
    }
}
