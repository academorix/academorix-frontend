<?php

declare(strict_types=1);

namespace Academorix\Webhook\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/tenant/webhook/subscriptions/{id}/test`.
 *
 * Optional `eventName` — when supplied, the caller specifies which
 * event name to fire in the test dispatch (must be one the subscription
 * is subscribed to). When omitted, the first event on the subscription
 * is used.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TestWebhookSubscriptionRequestData extends Data
{
    public function __construct(
        #[StringType, Max(128)]
        public ?string $eventName = null,
    ) {
    }
}
