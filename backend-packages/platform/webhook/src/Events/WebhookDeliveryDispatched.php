<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookDelivery;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a delivery is queued for its first attempt.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.delivery.dispatched')]
final readonly class WebhookDeliveryDispatched implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public WebhookDelivery $delivery)
    {
    }
}
