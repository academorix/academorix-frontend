<?php

declare(strict_types=1);

namespace Stackra\Storage\Jobs;

use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Post-upload orchestration entry point — the observer normally
 * fans out to
 * {@see ScanFileForVirusesJob} +
 * {@see GenerateFileVariantsJob} directly, but this job exists so
 * the module can be extended with a single chain-of-responsibility
 * step (e.g. capture the tenant quota into the entitlements
 * package).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('storage')]
#[Timeout(300)]
#[Tries(3)]
final class ProcessUploadedFileJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $fileId)
    {
    }

    public function handle(FileRepositoryInterface $files): void
    {
        $file = $files->find($this->fileId);
        if ($file === null) {
            return;
        }

        // fan-out — antivirus first, variants next.
        ScanFileForVirusesJob::dispatch($this->fileId);
        GenerateFileVariantsJob::dispatch($this->fileId);
        SyncStorageEntitlementUsageJob::dispatch((string) $file->getAttribute('tenant_id'));
    }

    public function failed(\Throwable $e): void
    {
    }
}
