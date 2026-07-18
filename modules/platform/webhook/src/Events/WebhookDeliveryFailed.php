<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a retryable delivery attempt fails.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.delivery.failed')]
final readonly class WebhookDeliveryFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookDelivery $delivery,
        public int $attempt,
        public ?int $httpStatusCode,
        public ?string $errorMessage,
    ) {
    }
}
