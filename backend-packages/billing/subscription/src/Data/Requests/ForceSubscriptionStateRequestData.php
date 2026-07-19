<?php

declare(strict_types=1);

namespace Academorix\Subscription\Data\Requests;

use Academorix\Subscription\Enums\SubscriptionState;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/subscriptions/{tenant}/force-state`.
 *
 * Emergency state override — every use audit-logged with mandatory
 * reason.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ForceSubscriptionStateRequestData extends Data
{
    /**
     * @param  string  $state    Target state — must be a SubscriptionState case.
     * @param  string  $reason   Non-empty reason for audit trail.
     */
    public function __construct(
        #[Required, Enum(SubscriptionState::class)]
        public string $state,

        #[Required, StringType, Max(500)]
        public string $reason,
    ) {
    }
}
