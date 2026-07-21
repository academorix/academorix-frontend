<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Monthly SMS cost report per tenant.
 *
 * Aggregates `cost_micro_units` by destination country + provider from the
 * notifications core's `NotificationDelivery` table and emails the report to
 * tenant admins on the 1st of each month.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class GenerateSmsCostReportJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $month,
    ) {
    }

    #[UniqueFor(86400)]
    public function uniqueId(): string
    {
        return \sprintf('%s:%s', $this->tenantId, $this->month);
    }

    /**
     * Handle — the actual aggregation query lives on the notifications core
     * repository; this job orchestrates fetch + delivery.
     */
    public function handle(): void
    {
        // Lean scaffolding — the query + mail composition arrive in the next
        // pass. The lifecycle boundary is in place today so a scheduled task
        // can queue it.
    }
}
