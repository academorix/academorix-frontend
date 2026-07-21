<?php

declare(strict_types=1);

namespace Stackra\Subscription\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/subscription/swap`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class SwapPlanRequestData extends Data
{
    /**
     * @param  string  $planId    Target plan ULID.
     * @param  bool    $prorate   Prorate the swap (upgrade default). Override for
     *                            operator-controlled swap semantics.
     */
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $planId,

        #[BooleanType]
        public bool $prorate = true,
    ) {
    }
}
