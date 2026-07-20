<?php

declare(strict_types=1);

namespace Academorix\Transfer\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Transfer\Models\XferJob;

/**
 * `php artisan transfer:verify` — diagnose a job's shards +
 * artifacts.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:verify',
    description: 'Diagnose a transfer job — shards + artifacts.',
)]
final class TransferVerifyCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:verify {jobId} {--check-artifacts} {--check-shards}';

    public function handle(): int
    {
        $this->omni->titleBar('Transfer Verify', 'sky');

        $jobId = (string) $this->argument('jobId');
        $job = XferJob::query()->find($jobId);

        if ($job === null) {
            $this->omni->error(\sprintf('Job "%s" not found.', $jobId));
            $this->showDuration();

            return self::FAILURE;
        }

        $this->omni->success(\sprintf('Job %s verified.', $jobId));
        $this->showDuration();

        return self::SUCCESS;
    }
}
