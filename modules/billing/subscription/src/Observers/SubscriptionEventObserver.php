<?php

declare(strict_types=1);

namespace Academorix\Subscription\Observers;

use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionEventRepositoryInterface;
use Academorix\Subscription\Exceptions\WebhookDuplicateException;
use Academorix\Subscription\Models\SubscriptionEvent;

/**
 * Lifecycle side effects on {@see SubscriptionEvent}.
 *
 * ## Responsibilities
 *
 *   - `creating` — refuse to write a row whose `provider_event_id`
 *     already exists in the table. Idempotency for Cashier webhook
 *     consumption.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionEventObserver
{
    public function __construct(
        private readonly SubscriptionEventRepositoryInterface $events,
    ) {
    }

    /**
     * `creating` — enforce idempotency on `provider_event_id`.
     */
    public function creating(SubscriptionEvent $event): void
    {
        /** @var mixed $rawProviderId */
        $rawProviderId = $event->{SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID};
        if (! \is_string($rawProviderId) || $rawProviderId === '') {
            return;
        }

        $existing = $this->events->findByProviderEventId($rawProviderId);
        if ($existing !== null) {
            throw new WebhookDuplicateException(\sprintf(
                'Subscription event with provider_event_id "%s" already recorded.',
                $rawProviderId,
            ));
        }
    }
}
