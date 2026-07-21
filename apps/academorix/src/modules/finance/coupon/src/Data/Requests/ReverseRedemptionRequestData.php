<?php

declare(strict_types=1);

namespace Academorix\Coupon\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/coupons/redemptions/{redemption}/reverse`.
 *
 * Manual admin reversal path — distinct from clawback (which cascades
 * from a finance refund). `reason` is a free-form audit note (required).
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ReverseRedemptionRequestData extends Data
{
    /**
     * @param  string       $reason  Free-form admin-provided reversal reason.
     * @param  string|null  $notes   Optional longer audit note.
     */
    public function __construct(
        #[Required, StringType, Max(500)]
        public string $reason,

        #[StringType, Max(2000)]
        public ?string $notes = null,
    ) {
    }
}
