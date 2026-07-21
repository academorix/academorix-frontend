<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a pinned subscription is auto-upgraded to a newer
 * `api_version` — usually because the previously-pinned version has
 * been sunset per the versioning module's rules.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.subscription.upgraded')]
final readonly class WebhookSubscriptionUpgraded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookSubscription $subscription,
        public string $fromVersion,
        public string $toVersion,
    ) {
    }
}
