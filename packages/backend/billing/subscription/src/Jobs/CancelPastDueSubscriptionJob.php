<?php

declare(strict_types=1);

namespace Stackra\Subscription\Jobs;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Enums\SubscriptionState;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Terminal step of dunning — cancel + suspend after all grace has
 * been exhausted.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
final class CancelPastDueSubscriptionJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $subscriptionId,
    ) {
    }

    /**
     * Idempotency key.
     */
    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return $this->subscriptionId;
    }

    /**
     * Handle the terminal cancel.
     */
    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        LoggerInterface $log,
    ): void {
        $subscription = $subscriptions->find($this->subscriptionId);
        if ($subscription === null) {
            $log->warning('cancel-past-due skipped — subscription missing', [
                'subscription_id' => $this->subscriptionId,
            ]);

            return;
        }

        $subscription->{SubscriptionInterface::ATTR_STATE} = SubscriptionState::Cancelled->value;
        $subscription->{SubscriptionInterface::ATTR_CANCELLED_AT} = \now();
        $subscription->save();
    }

    /**
     * Fail-soft.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
