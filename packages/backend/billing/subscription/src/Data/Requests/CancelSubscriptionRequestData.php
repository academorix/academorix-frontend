<?php

declare(strict_types=1);

namespace Academorix\Subscription\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/subscription/cancel`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CancelSubscriptionRequestData extends Data
{
    /**
     * @param  bool         $atPeriodEnd  True = defer cancel to period end (default). False = immediate.
     * @param  string|null  $reason       Optional cancellation reason. Recorded in the subscription event.
     */
    public function __construct(
        #[BooleanType]
        public bool $atPeriodEnd = true,

        #[StringType, Max(500)]
        public ?string $reason = null,
    ) {
    }
}
