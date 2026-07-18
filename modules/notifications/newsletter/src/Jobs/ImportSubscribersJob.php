<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Jobs;

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
 * Import subscribers from a CSV upload.
 *
 * Streams the CSV row-by-row and creates
 * {@see \Academorix\Newsletter\Models\NewsletterSubscription} rows
 * with `source = 'imported'`. Requires the `consent_evidence`
 * column on every row — rows missing it are skipped and reported
 * in the import output.
 *
 * The full CSV parsing pipeline is deferred to when the storage
 * module ships its signed-URL upload API. This job carries the
 * signature + wiring so the surface is stable for consumers.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(1800)]
#[Tries(2)]
#[UniqueFor(3600)]
final class ImportSubscribersJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $newsletterId,
        public readonly string $filePath,
    ) {
    }

    public function uniqueId(): string
    {
        return 'newsletter:import:' . $this->newsletterId . ':' . \hash('sha256', $this->filePath);
    }

    public function handle(LoggerInterface $log): void
    {
        // TODO: parse the CSV via the storage module's read stream
        // once its API is available. Log the handoff for now.
        $log->info('newsletter: import subscribers handoff (storage integration pending)', [
            'newsletter_id' => $this->newsletterId,
            'file_path'     => $this->filePath,
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
