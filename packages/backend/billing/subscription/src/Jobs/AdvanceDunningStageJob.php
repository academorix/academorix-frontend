<?php

declare(strict_types=1);

namespace Stackra\Subscription\Jobs;

use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Contracts\Services\DunningOrchestratorInterface;
use Carbon\CarbonImmutable;
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
 * Progress every past_due / grace / at_risk subscription that has
 * exhausted its grace window. Fires the matching event per
 * transition.
 *
 * Runs hourly. `ShouldBeUnique` ensures only one instance runs at
 * a time.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
#[UniqueFor(3600)]
final class AdvanceDunningStageJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Handle the advance.
     */
    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        DunningOrchestratorInterface $dunning,
        LoggerInterface $log,
    ): void {
        // The kill switch flips the whole progression off during
        // payment-provider incidents to prevent unfair suspensions.
        if ((bool) \config('subscription.dunning.enabled', true) === false) {
            $log->info('subscription dunning disabled by kill switch');

            return;
        }

        $due = $subscriptions->findDueForDunningAdvance(CarbonImmutable::now());
        $transitions = 0;

        foreach ($due as $subscription) {
            $before = $dunning->nextStage($subscription);
            $dunning->advance($subscription);

            if ($before !== null) {
                $transitions++;
            }
        }

        $log->info('subscription dunning advance complete', [
            'candidates'  => $due->count(),
            'transitions' => $transitions,
        ]);
    }

    /**
     * Never propagate — dunning is best-effort.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
