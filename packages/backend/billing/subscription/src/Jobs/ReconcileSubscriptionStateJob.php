<?php

declare(strict_types=1);

namespace Stackra\Subscription\Jobs;

use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
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
 * Sample-check our Subscription state against Cashier's provider-
 * side state. Detects drift from missed webhooks.
 *
 * The default implementation logs a summary; production apps
 * override the binding OR pair this job with a Cashier consumer
 * that actually calls `subscription->asStripeSubscription()` to
 * compare.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
#[UniqueFor(3600)]
final class ReconcileSubscriptionStateJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Handle the reconciliation sample.
     */
    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        LoggerInterface $log,
    ): void {
        $sampleSize = (int) \config('subscription.reconciliation.sample_size', 100);

        // The default implementation only logs — the paginator hits
        // the DB but doesn't call the provider. Consumers override
        // the binding when they land Cashier.
        $log->info('subscription reconciliation dry-run', [
            'sample_size' => $sampleSize,
        ]);
    }

    /**
     * Fail-soft.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
