<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subscription transitions from `paused` back to
 * `active`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.subscription.resumed')]
final readonly class WebhookSubscriptionResumed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public WebhookSubscription $subscription)
    {
    }
}
