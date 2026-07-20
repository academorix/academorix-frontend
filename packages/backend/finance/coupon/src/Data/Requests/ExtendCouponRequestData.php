<?php

declare(strict_types=1);

namespace Academorix\Coupon\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/coupons/{coupon}/extend`.
 *
 * `valid_until` MUST be an ISO-8601 timestamp AFTER `now`; the action
 * rejects (409) when it isn't.
 *
 * @category Coupon
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ExtendCouponRequestData extends Data
{
    /**
     * @param  string  $validUntil  ISO-8601 new expiry timestamp.
     */
    public function __construct(
        #[Required, StringType]
        public string $validUntil,
    ) {
    }
}
