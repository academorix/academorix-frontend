<?php

declare(strict_types=1);

namespace Stackra\Coupon\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/coupons/{code}/preview`.
 *
 * Read-only preview — the action never inserts a redemption row.
 * Rate-limited via `coupon.rate_limit` (10/IP/hour) to prevent
 * brute-force code enumeration.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PreviewCouponRequestData extends Data
{
    /**
     * @param  string       $customerType       `user` or `athlete`.
     * @param  string       $customerId         Prospective redeemer.
     * @param  int          $sourceAmountCents  Pre-discount cart total in cents.
     * @param  string       $sourceCurrency     ISO-4217.
     * @param  string|null  $appliedToType      `invoice` / `membership` (advisory).
     * @param  string|null  $appliedToId        Target row id (advisory).
     * @param  string|null  $targetPlanId       Membership plan id when the target is plan-eligible.
     */
    public function __construct(
        #[Required, StringType]
        public string $customerType,

        #[Required, StringType]
        public string $customerId,

        #[Required, Min(0)]
        public int $sourceAmountCents,

        #[Required, StringType, Regex('/^[A-Z]{3}$/')]
        public string $sourceCurrency,

        #[StringType]
        public ?string $appliedToType = null,

        #[StringType]
        public ?string $appliedToId = null,

        #[StringType]
        public ?string $targetPlanId = null,
    ) {
    }
}
