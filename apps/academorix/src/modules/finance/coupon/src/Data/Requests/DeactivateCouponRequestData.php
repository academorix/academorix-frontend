<?php

declare(strict_types=1);

namespace Academorix\Coupon\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/coupons/{coupon}/deactivate`.
 *
 * Admin-authored reason feeds the `CouponDeactivated.reason` payload
 * for audit downstream.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class DeactivateCouponRequestData extends Data
{
    /**
     * @param  string|null  $reason  Free-form admin note attached to the audit log.
     */
    public function __construct(
        #[StringType, Max(500)]
        public ?string $reason = null,
    ) {
    }
}
