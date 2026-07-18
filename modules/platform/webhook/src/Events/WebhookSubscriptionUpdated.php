<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a webhook subscription is updated.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.subscription.updated')]
final readonly class WebhookSubscriptionUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  WebhookSubscription  $subscription  The subscription after the update.
     * @param  list<string>         $dirty         Column names that changed in this update.
     */
    public function __construct(
        public WebhookSubscription $subscription,
        public array $dirty = [],
    ) {
    }
}
