<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a webhook subscription is created.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.subscription.created')]
final readonly class WebhookSubscriptionCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public WebhookSubscription $subscription)
    {
    }
}
