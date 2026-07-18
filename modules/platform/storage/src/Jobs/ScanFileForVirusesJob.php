<?php

declare(strict_types=1);

namespace Academorix\Storage\Jobs;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Repositories\FileRepositoryInterface;
use Academorix\Storage\Contracts\Services\AntivirusScannerInterface;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Events\FileScanned;
use Academorix\Storage\Events\FileVirusFound;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Antivirus scan for one {@see \Academorix\Storage\Models\File}.
 *
 * Delegates to the bound {@see AntivirusScannerInterface}. Retries
 * with exponential backoff — a scanner that's temporarily down
 * should not lose files.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('antivirus')]
#[Timeout(300)]
#[Tries(5)]
#[Backoff(60, 300, 900, 1800, 3600)]
final class ScanFileForVirusesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $fileId)
    {
    }

    public function handle(
        FileRepositoryInterface $files,
        AntivirusScannerInterface $scanner,
    ): void {
        $file = $files->find($this->fileId);
        if ($file === null) {
            return;
        }

        // Mark scanning so concurrent redemption attempts see it.
        $file->update([FileInterface::ATTR_VIRUS_SCAN_STATE => VirusScanState::Scanning->value]);

        $result = $scanner->scan($file);
        $state  = VirusScanState::tryFrom((string) $result['status']) ?? VirusScanState::Failed;

        $file->update([
            FileInterface::ATTR_VIRUS_SCAN_STATE   => $state->value,
            FileInterface::ATTR_VIRUS_SCAN_DETAILS => $result['details'],
            FileInterface::ATTR_SCANNED_AT         => \now(),
        ]);

        FileScanned::dispatch($file->refresh(), $state);

        if ($state === VirusScanState::Quarantined) {
            FileVirusFound::dispatch($file, (array) ($result['details'] ?? []));
        }
    }

    public function failed(\Throwable $e): void
    {
        // Report via monitoring — the retention job will surface the
        // stuck row in the antivirus dashboard.
    }
}
