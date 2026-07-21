<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Webhook\Models\WebhookDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the receiver responded with a 2xx status.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.delivered')]
final readonly class WebhookDelivered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookDelivery $delivery,
        public int $httpStatusCode,
        public int $latencyMs,
    ) {
    }
}
