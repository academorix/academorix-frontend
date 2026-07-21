<?php

declare(strict_types=1);

namespace Stackra\Subscription\Jobs;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Events\TrialEnding;
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
 * Fire `TrialEnding` warnings on subscriptions inside the warning
 * window; transition trials whose `trial_ends_at` has passed to
 * `active` or `cancelled` depending on whether a payment method is
 * on file.
 *
 * Runs daily. `ShouldBeUnique` ensures the same slot is not scanned
 * twice by two workers.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
#[UniqueFor(3600)]
final class ExpireTrialsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Handle the trial-expiration sweep.
     */
    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        LoggerInterface $log,
    ): void {
        $now = CarbonImmutable::now();
        $warningDays = (int) \config('subscription.trial.warning_days_before', 3);

        // Warning window — fire TrialEnding for trials inside the
        // heads-up band, from now until warning_days_before ahead.
        $endingWindowUpper = $now->addDays($warningDays);
        $ending = $subscriptions->findTrialsEndingBetween($now, $endingWindowUpper);
        foreach ($ending as $subscription) {
            $trialEndsAt = $subscription->{SubscriptionInterface::ATTR_TRIAL_ENDS_AT};
            $days = $trialEndsAt === null ? 0 : \max(0, $now->diffInDays($trialEndsAt, false));
            TrialEnding::dispatch($subscription, $days);
        }

        // Expired trials — transition to active if payment method
        // present (denormalised via provider_customer_id), otherwise
        // cancelled. The observer fires the matching state event.
        $expired = $subscriptions->findTrialsExpiredBefore($now);
        foreach ($expired as $subscription) {
            $hasCustomer = (string) ($subscription->{SubscriptionInterface::ATTR_PROVIDER_CUSTOMER_ID} ?? '') !== '';

            $subscription->{SubscriptionInterface::ATTR_STATE} = $hasCustomer
                ? SubscriptionState::Active->value
                : SubscriptionState::Cancelled->value;
            $subscription->{SubscriptionInterface::ATTR_TRIAL_ENDS_AT} = null;

            if (! $hasCustomer) {
                $subscription->{SubscriptionInterface::ATTR_CANCELLED_AT} = $now;
            }

            $subscription->save();
        }

        $log->info('subscription trials expire sweep complete', [
            'warnings_fired'   => $ending->count(),
            'trials_processed' => $expired->count(),
        ]);
    }

    /**
     * Fail-soft — the sweep re-scans on the next run.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
