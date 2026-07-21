<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Contracts\Services\ReputationMonitorInterface;
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
use Psr\Log\LoggerInterface;

/**
 * Generate the monthly reputation report for a newsletter.
 *
 * Aggregates completed campaigns in the evaluation window and
 * emails the newsletter owner. Runs once per newsletter per month.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(180)]
#[Tries(2)]
#[UniqueFor(86400)]
final class GenerateReputationReportJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $newsletterId,
        public readonly string $month = 'previous',
    ) {
    }

    public function uniqueId(): string
    {
        return 'newsletter:reputation-report:' . $this->newsletterId . ':' . $this->month;
    }

    public function handle(
        NewsletterRepositoryInterface $newsletters,
        ReputationMonitorInterface $monitor,
        LoggerInterface $log,
    ): void {
        $newsletter = $newsletters->find($this->newsletterId);
        if ($newsletter === null) {
            return;
        }

        $report = $monitor->reportFor($newsletter, $this->month);

        // TODO: dispatch a NewsletterReputationAlertNotification when
        // the reputation monitor's evaluate() flagged a breach in
        // the window. For now the report is logged so downstream
        // wiring can pick it up.
        $log->info('newsletter: reputation report generated', [
            'newsletter_id' => $this->newsletterId,
            'month'         => $this->month,
            'report'        => $report,
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
