<?php

declare(strict_types=1);

namespace Stackra\Coupon\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Verdict of a coupon-validation attempt.
 *
 * `valid = true` means the caller can safely apply the discount +
 * increment usage counters. `valid = false` sets `reason` to a
 * machine-readable code (`not_found` / `expired` / `usage_cap_reached`
 * / `per_customer_limit_reached` / `not_started` / `inactive` /
 * `minimum_order_not_met` / `plan_not_applicable`).
 *
 * When `valid = true`, `discountCents` carries the computed discount
 * amount (either the flat `discount_amount` for `fixed_amount`
 * coupons OR `order_amount * discount_amount / 100` for `percentage`
 * coupons, capped at `orderAmountCents` — a 30% coupon on a $50
 * order can never yield a negative total).
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class CouponVerdictData extends Data
{
    /**
     * @param  bool         $valid           Top-line pass/fail.
     * @param  string|null  $reason          Machine-readable rejection reason when invalid.
     * @param  string|null  $couponId        Coupon primary key when found.
     * @param  int          $discountCents   Computed discount amount in cents.
     * @param  string|null  $currency        ISO-4217 currency of the discount.
     * @param  string|null  $discountType    `fixed_amount` / `percentage` when found.
     */
    public function __construct(
        public bool $valid,
        public ?string $reason = null,
        public ?string $couponId = null,
        public int $discountCents = 0,
        public ?string $currency = null,
        public ?string $discountType = null,
    ) {
    }
}
