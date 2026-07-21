<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Models\NewsletterSubscription;
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
 * Two prunes:
 *
 *  1. `pending_confirmation` subscriptions past their
 *     `confirmation_expires_at` — soft-delete them.
 *  2. Long-active, zero-engagement subscribers past 365 days —
 *     flag for admin review, NEVER auto-delete. Left as a future
 *     addition; the current implementation only handles (1).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(300)]
#[Tries(2)]
#[UniqueFor(86400)]
final class PruneUnengagedSubscribersJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $newsletterId)
    {
    }

    public function uniqueId(): string
    {
        return 'newsletter:prune:' . $this->newsletterId;
    }

    public function handle(NewsletterSubscriptionRepositoryInterface $subscriptions): void
    {
        $expired = $subscriptions->findExpiredPending($this->newsletterId, \now());
        foreach ($expired as $subscription) {
            /** @var NewsletterSubscription $subscription */
            $subscription->delete();
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
