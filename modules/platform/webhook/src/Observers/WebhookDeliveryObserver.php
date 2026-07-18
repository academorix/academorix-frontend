<?php

declare(strict_types=1);

namespace Academorix\Webhook\Observers;

use Academorix\Webhook\Events\WebhookDeliveryDispatched;
use Academorix\Webhook\Models\WebhookDelivery;

/**
 * Lifecycle side effect on {@see WebhookDelivery} — emit
 * {@see WebhookDeliveryDispatched} on `created`. Delivery rows are
 * append-only so `updating` / `deleted` hooks are intentionally
 * absent — outcome events (`Delivered`, `Failed`, `FailedPermanent`)
 * are emitted from the dispatch job, not from the observer.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookDeliveryObserver
{
    public function created(WebhookDelivery $delivery): void
    {
        WebhookDeliveryDispatched::dispatch($delivery);
    }
}
