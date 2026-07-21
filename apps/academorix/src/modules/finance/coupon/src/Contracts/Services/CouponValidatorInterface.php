<?php

declare(strict_types=1);

namespace Stackra\Coupon\Contracts\Services;

use Stackra\Coupon\Data\CouponVerdictData;
use Stackra\Coupon\Services\CouponValidator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the coupon-redemption gate.
 *
 * Every redemption attempt flows through this validator BEFORE the
 * order actually applies the discount. Checks:
 *
 *  - Coupon exists + belongs to tenant.
 *  - `is_active = true`.
 *  - `valid_from` &lt;= now &lt; `valid_until`.
 *  - Global cap: `usage_count &lt; usage_cap` (or `usage_cap IS NULL`).
 *  - Per-customer cap: redemptions by this customer &lt; `per_customer_limit`.
 *  - Applicability: order matches `applicability` clause
 *    (e.g. `plan_ids: [plan_pro, plan_enterprise]`).
 *  - Minimum-order-value gate.
 *
 * Concrete: {@see CouponValidator}.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[Bind(CouponValidator::class)]
interface CouponValidatorInterface
{
    /**
     * Validate a redemption attempt.
     *
     * @param  string       $tenantId          Owning tenant.
     * @param  string       $couponCode        The user-typed redemption code (raw, case-insensitive).
     * @param  string       $customerId        Redeeming customer id.
     * @param  int          $orderAmountCents  Pre-discount order total in cents.
     * @param  string       $orderCurrency     ISO-4217 currency of the order.
     * @param  string|null  $planId            When present, checked against `applicable_plan_ids`.
     */
    public function validate(
        string $tenantId,
        string $couponCode,
        string $customerId,
        int $orderAmountCents,
        string $orderCurrency,
        ?string $planId = null,
    ): CouponVerdictData;
}
