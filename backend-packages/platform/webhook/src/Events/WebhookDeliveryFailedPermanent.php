<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a delivery is marked failed-permanent (retry
 * budget exhausted OR the receiver returned a non-retryable status).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.delivery.failed_permanent')]
final readonly class WebhookDeliveryFailedPermanent implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookDelivery $delivery,
        public ?int $httpStatusCode,
        public ?string $errorMessage,
    ) {
    }
}
