<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Contracts\Services\ReputationMonitorInterface;
use Academorix\Newsletter\Jobs\GenerateReputationReportJob;

/**
 * `php artisan newsletter:reputation-report` — print a reputation
 * report for a newsletter (default: the previous month).
 *
 * `--email` dispatches the emailed version via the async job.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'newsletter:reputation-report',
    description: 'Print or email a newsletter reputation report.',
)]
final class ReputationReportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'newsletter:reputation-report
        {--newsletter= : Newsletter id (nlp_...); required for the report}
        {--month=previous : Which month to report (previous|current)}
        {--email : Email the report to the newsletter owner instead of printing}';

    /**
     * Execute the command.
     */
    public function handle(
        NewsletterRepositoryInterface $newsletters,
        ReputationMonitorInterface $monitor,
    ): int {
        $this->omni->titleBar('Newsletter — Reputation Report', 'sky');

        $newsletterId = (string) ($this->option('newsletter') ?? '');
        $month        = (string) ($this->option('month') ?? 'previous');

        if ($newsletterId === '') {
            $this->omni->error('--newsletter is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        if ((bool) $this->option('email')) {
            GenerateReputationReportJob::dispatch($newsletterId, $month);
            $this->omni->success(\sprintf(
                'Dispatched emailed reputation report for "%s" (%s).',
                $newsletterId,
                $month,
            ));
            $this->showDuration();

            return self::SUCCESS;
        }

        $newsletter = $newsletters->find($newsletterId);
        if ($newsletter === null) {
            $this->omni->error(\sprintf('Newsletter "%s" not found.', $newsletterId));
            $this->showDuration();

            return self::FAILURE;
        }

        $report = $monitor->reportFor($newsletter, $month);
        $this->omni->info($report);
        $this->omni->success('Report rendered.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
