<?php

declare(strict_types=1);

namespace Academorix\Subscription\Jobs;

use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Contracts\Services\CashierAdapterInterface;
use Academorix\Subscription\Events\UsageReported;
use Academorix\Subscription\Exceptions\UsageReportFailedException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Report metered usage to the payment provider via
 * {@see CashierAdapterInterface::reportUsage()}. Called by the
 * entitlements module at period end.
 *
 * Financial-material — retries are aggressive but bounded; a final
 * failure surfaces as a `UsageReportFailedException` for ops.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Queue('notifications-critical')]
#[Tries(5)]
#[Backoff(60, 300, 1800, 3600, 21600)]
final class ReportMeteredUsageJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $subscriptionId  Owning subscription.
     * @param  string  $priceId         Provider price identifier (Stripe / Paddle).
     * @param  string  $meterKey        Domain-facing meter identifier.
     * @param  int     $amount          Delta to report.
     * @param  int|null $timestamp      Optional unix seconds; null = now.
     */
    public function __construct(
        public readonly string $subscriptionId,
        public readonly string $priceId,
        public readonly string $meterKey,
        public readonly int $amount,
        public readonly ?int $timestamp = null,
    ) {
    }

    /**
     * Idempotency — `(subscription_id, meter_key, timestamp)` is
     * unique across a period.
     */
    #[UniqueFor(7200)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s:%s', $this->subscriptionId, $this->meterKey, $this->timestamp ?? 'now');
    }

    /**
     * Handle the report.
     *
     * @throws UsageReportFailedException  When the provider rejects the report.
     */
    public function handle(
        SubscriptionRepositoryInterface $subscriptions,
        CashierAdapterInterface $cashier,
        LoggerInterface $log,
    ): void {
        $subscription = $subscriptions->find($this->subscriptionId);
        if ($subscription === null) {
            $log->warning('metered usage report skipped — subscription missing', [
                'subscription_id' => $this->subscriptionId,
            ]);

            return;
        }

        $tenantId = (string) $subscription->{\Academorix\Subscription\Contracts\Data\SubscriptionInterface::ATTR_TENANT_ID};

        try {
            $providerUsageId = $cashier->reportUsage($tenantId, $this->priceId, $this->amount, $this->timestamp);
        } catch (\Throwable $e) {
            throw (new UsageReportFailedException($e->getMessage(), previous: $e));
        }

        if ($providerUsageId === null) {
            // Provider was `invoice` — nothing to report.
            return;
        }

        UsageReported::dispatch(
            $subscription,
            $this->meterKey,
            $this->amount,
            $providerUsageId,
        );
    }

    /**
     * Fail-soft — the retry policy already surfaced the failure.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
