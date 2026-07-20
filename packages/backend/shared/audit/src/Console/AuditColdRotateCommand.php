<?php

declare(strict_types=1);

namespace Academorix\Audit\Console;

use Academorix\Audit\Jobs\RotateAuditColdStorageJob;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;

/**
 * `php artisan audit:cold-rotate` — dispatch
 * {@see RotateAuditColdStorageJob}.
 *
 * The rotation batch size is configured via `audit.cold.rotate_batch_size`;
 * multiple invocations are safe (the job is idempotent).
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'audit:cold-rotate',
    description: 'Dispatch RotateAuditColdStorageJob to move hot audits to cold storage.',
)]
final class AuditColdRotateCommand extends BaseCommand
{
    public function handle(): int
    {
        $this->omni->titleBar('Cold-rotate Audit Rows', 'sky');

        RotateAuditColdStorageJob::dispatch();

        $this->omni->success('Dispatched RotateAuditColdStorageJob.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
