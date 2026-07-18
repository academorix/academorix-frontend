<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when notifications-mail's `MailBounced` event fires
 * for a newsletter delivery.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.subscription.bounced')]
final readonly class NewsletterSubscriptionBounced implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $subscriptionId  Subscription id.
     * @param  string  $bounceKind      `hard` or `soft`.
     */
    public function __construct(
        public string $subscriptionId,
        public string $bounceKind,
    ) {
    }
}
