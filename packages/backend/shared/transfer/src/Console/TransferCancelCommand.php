<?php

declare(strict_types=1);

namespace Academorix\Transfer\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Enums\XferJobStatus;
use Academorix\Transfer\Models\XferJob;

/**
 * `php artisan transfer:cancel` — cancel a queued or running job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:cancel',
    description: 'Cancel a queued or running transfer job.',
)]
final class TransferCancelCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:cancel {jobId} {--reason=} {--force}';

    public function handle(): int
    {
        $this->omni->titleBar('Transfer Cancel', 'amber');

        $jobId = (string) $this->argument('jobId');
        $job = XferJob::query()->find($jobId);

        if ($job === null) {
            $this->omni->error(\sprintf('Job "%s" not found.', $jobId));
            $this->showDuration();

            return self::FAILURE;
        }

        $job->fill([
            XferJobInterface::ATTR_STATUS         => XferJobStatus::Cancelled->value,
            XferJobInterface::ATTR_FAILED_REASON  => (string) $this->option('reason'),
        ])->save();

        $this->omni->success(\sprintf('Cancelled job %s.', $jobId));
        $this->showDuration();

        return self::SUCCESS;
    }
}
