<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Services;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Services\SubscriberGrowthTrackerInterface;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Stackra\Newsletter\Models\NewsletterSubscription;
use DateTimeInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default {@see SubscriberGrowthTrackerInterface}.
 *
 * Runs raw aggregate queries against the subscription table. The
 * simple implementation is fine for tenants up to a few hundred
 * thousand subscribers; a materialised-view rewrite is planned when
 * needed.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultSubscriberGrowthTracker implements SubscriberGrowthTrackerInterface
{
    /**
     * {@inheritDoc}
     */
    public function summarize(string $newsletterId, DateTimeInterface $since, DateTimeInterface $until): array
    {
        /** @var int $newSubscribers */
        $newSubscribers = NewsletterSubscription::query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_STATUS, NewsletterSubscriptionStatus::Active->value)
            ->whereBetween(
                NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT,
                [$since, $until],
            )
            ->count();

        /** @var int $unsubscribes */
        $unsubscribes = NewsletterSubscription::query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->whereIn(NewsletterSubscriptionInterface::ATTR_STATUS, [
                NewsletterSubscriptionStatus::Unsubscribed->value,
                NewsletterSubscriptionStatus::Bounced->value,
                NewsletterSubscriptionStatus::Complained->value,
            ])
            ->whereBetween(
                NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT,
                [$since, $until],
            )
            ->count();

        /** @var int $activeAtEnd */
        $activeAtEnd = NewsletterSubscription::query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletterId)
            ->where(NewsletterSubscriptionInterface::ATTR_STATUS, NewsletterSubscriptionStatus::Active->value)
            ->where(NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT, '<=', $until)
            ->count();

        return [
            'new_subscribers' => $newSubscribers,
            'unsubscribes'    => $unsubscribes,
            'net_change'      => $newSubscribers - $unsubscribes,
            'active_at_end'   => $activeAtEnd,
        ];
    }
}
