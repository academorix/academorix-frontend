<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Listeners;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Events\PushInvalidToken;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Marks a subscription as inactive on receipt of {@see PushInvalidToken}.
 *
 * Runs asynchronously on the `notifications` queue. Sets `is_active = false`
 * + `invalid_token_reported_at = now()` — the observer's `updating` hook then
 * fires {@see \Stackra\Notifications\Push\Events\PushSubscriptionExpired}
 * with the reason carried on the invalid-token event.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class ExpireSubscriptionListener implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(
        private readonly PushSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function handle(PushInvalidToken $event): void
    {
        $subscription = $this->subscriptions->find($event->subscriptionId);
        if ($subscription === null) {
            return;
        }

        // No-op when already flipped — invalid-token events can arrive from
        // multiple sources for the same row (send-time reject + APNs
        // Feedback + Ingest webhook).
        if ($subscription->{PushSubscriptionInterface::ATTR_IS_ACTIVE} === false) {
            return;
        }

        $subscription->forceFill([
            PushSubscriptionInterface::ATTR_IS_ACTIVE                 => false,
            PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT => now(),
        ])->save();
    }
}
