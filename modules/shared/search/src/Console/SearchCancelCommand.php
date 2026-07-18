<?php

declare(strict_types=1);

namespace Academorix\Search\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Search\Contracts\Services\IndexOrchestratorInterface;

/**
 * `php artisan search:cancel` — cancel a queued or running sync job.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:cancel',
    description: 'Cancel a queued or running search sync job.',
)]
final class SearchCancelCommand extends BaseCommand
{
    protected $signature = 'search:cancel
        {jobId : Sync job id}
        {--reason= : Cancellation reason}
        {--force : Force cancel a terminal-state job}';

    public function handle(IndexOrchestratorInterface $orchestrator): int
    {
        $this->omni->titleBar('Search Cancel', 'rose');

        $jobId  = (string) $this->argument('jobId');
        $reason = $this->option('reason');

        $cancelled = $orchestrator->cancel(
            $jobId,
            $reason === null ? null : (string) $reason,
        );

        $this->omni->success(\sprintf(
            'Cancelled %s → status=%s',
            (string) $cancelled->getKey(),
            (string) $cancelled->status?->value,
        ));

        $this->showDuration();

        return self::SUCCESS;
    }
}
