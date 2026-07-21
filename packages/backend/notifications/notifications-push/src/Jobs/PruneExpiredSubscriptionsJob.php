<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Jobs;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Stackra\Notifications\Push\Events\PushInvalidToken;
use Illuminate\Bus\Queueable;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Prune subscriptions idle beyond the retention window.
 *
 * Soft-deletes rows whose `last_seen_at < now() - retention.idle_days`.
 * Also fires {@see PushInvalidToken} with reason=idle_prune so the standard
 * expire pipeline picks up the transition.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class PruneExpiredSubscriptionsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $uniqueFor = 86400;

    public function uniqueId(): string
    {
        return 'notifications-push:prune-expired-subscriptions';
    }

    public function handle(
        PushSubscriptionRepositoryInterface $subscriptions,
        #[Config('notifications-push.retention.idle_days')] int $idleDays,
    ): void {
        $cutoff = now()->subDays(\max(1, $idleDays));

        foreach ($subscriptions->findIdleBefore($cutoff) as $subscription) {
            // Fire the invalid-token event so the standard listener flips
            // `is_active` + writes the audit trail — same code path a real
            // provider report takes.
            event(new PushInvalidToken(
                subscriptionId: (string) $subscription->getKey(),
                provider: (string) $subscription->getAttribute(
                    PushSubscriptionInterface::ATTR_PROVIDER,
                ),
                reason: PushSubscriptionExpiredReason::IdlePrune,
            ));

            $subscription->delete();
        }
    }
}
