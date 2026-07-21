<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Recompute `engagement_score` for a subscription.
 *
 * Called by the open + click listeners after each engagement
 * signal. The score bounds to [0, 100] and weights recent activity
 * higher via a linear-decay approximation:
 *
 *   score = min(100, opens * 1 + clicks * 5 + weeks_active * 0.5)
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(30)]
#[Tries(2)]
#[UniqueFor(60)]
final class TrackNewsletterEngagementJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $subscriptionId)
    {
    }

    public function uniqueId(): string
    {
        return 'newsletter:engagement:' . $this->subscriptionId;
    }

    public function handle(NewsletterSubscriptionRepositoryInterface $subscriptions): void
    {
        $subscription = $subscriptions->find($this->subscriptionId);
        if ($subscription === null) {
            return;
        }

        // The full open/click counts aren't stored on the row today;
        // we use the last-opened/last-clicked recency as a proxy.
        $now = \now();
        $weeksActive = 0;
        if ($subscribedAt = $subscription->{NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT}) {
            $weeksActive = (int) $now->diffInWeeks($subscribedAt);
        }

        $recentOpen  = $this->recencyPoints($subscription->{NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT});
        $recentClick = $this->recencyPoints($subscription->{NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT}) * 5;

        $score = (int) \min(100, (int) \floor($recentOpen + $recentClick + ($weeksActive * 0.5)));

        $subscription->update([
            NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE => $score,
        ]);
    }

    /**
     * Points awarded for recent activity. Full points within 7 days,
     * decays linearly to zero at 90 days.
     */
    private function recencyPoints(mixed $timestamp): int
    {
        if ($timestamp === null) {
            return 0;
        }

        try {
            /** @var \DateTimeInterface $timestamp */
            $daysAgo = \now()->diffInDays($timestamp);
        } catch (\Throwable) {
            return 0;
        }

        if ($daysAgo <= 7) {
            return 10;
        }
        if ($daysAgo >= 90) {
            return 0;
        }

        return (int) \floor(10 * (1 - ($daysAgo - 7) / 83));
    }

    public function failed(\Throwable $e): void
    {
    }
}
