<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

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
 * Export subscribers to CSV.
 *
 * Applies the caller-supplied filter map to the subscription
 * repository, streams the matching rows into a CSV file, uploads
 * to storage, and returns the signed URL via the completion event.
 *
 * Storage integration is deferred to when the storage module ships
 * its signed-URL API. This job carries the signature + wiring so
 * the surface is stable for consumers.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(1800)]
#[Tries(2)]
#[UniqueFor(3600)]
final class ExportSubscribersJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $filter
     */
    public function __construct(
        public readonly string $newsletterId,
        public readonly array $filter,
    ) {
    }

    public function uniqueId(): string
    {
        return 'newsletter:export:' . $this->newsletterId . ':' . \hash('sha256', (string) \json_encode($this->filter));
    }

    public function handle(LoggerInterface $log): void
    {
        // TODO: stream to CSV + upload to storage once the module's
        // signed-URL API is available. Log the handoff for now.
        $log->info('newsletter: export subscribers handoff (storage integration pending)', [
            'newsletter_id' => $this->newsletterId,
            'filter'        => $this->filter,
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
