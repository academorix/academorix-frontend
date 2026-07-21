<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Services;

use Stackra\Newsletter\Services\DefaultSubscriberGrowthTracker;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;

/**
 * Compute subscriber-growth aggregates for a newsletter.
 *
 * Produces the rolling metrics the admin dashboard renders — new
 * subscribers per period, unsubscribes per period, net change,
 * cumulative active count. Kept behind an interface because the
 * naive implementation runs full aggregations on the subscriptions
 * table; a future materialised-view implementation could slot in
 * without touching callers.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(DefaultSubscriberGrowthTracker::class)]
interface SubscriberGrowthTrackerInterface
{
    /**
     * Aggregate growth counters for `$newsletterId` inside the
     * window `[since, until]`.
     *
     * @return array{
     *     new_subscribers: int,
     *     unsubscribes: int,
     *     net_change: int,
     *     active_at_end: int,
     * }
     */
    public function summarize(string $newsletterId, DateTimeInterface $since, DateTimeInterface $until): array;
}
