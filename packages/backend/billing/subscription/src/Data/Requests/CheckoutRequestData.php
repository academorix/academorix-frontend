<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/subscription/checkout`.
 *
 * Body: `{ plan_id }`. Returns a Cashier checkout session URL that
 * the client redirects the operator to.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CheckoutRequestData extends Data
{
    /**
     * @param  string  $planId  Target plan ULID (pln_<26>).
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $planId,
    ) {
    }
}
