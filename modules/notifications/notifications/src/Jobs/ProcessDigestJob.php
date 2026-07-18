<?php

declare(strict_types=1);

namespace Academorix\Notifications\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Collect pending notifications for one digest bucket at its window
 * boundary, render through the digest template, dispatch, then mark
 * items `digest_delivered_at`.
 *
 * `ShouldBeUnique` — one in-flight per `(user, category, channel,
 * scheduled_for)` tuple.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Queue('notifications-digests')]
#[Tries(3)]
#[Backoff(60, 300, 1800)]
final class ProcessDigestJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $digestId  Digest bucket to render.
     */
    public function __construct(public readonly string $digestId)
    {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return 'digest:' . $this->digestId;
    }

    /**
     * Render + dispatch the digest.
     *
     * Concrete rendering logic lands in a follow-up slice — this
     * shell keeps the wire contract stable.
     */
    public function handle(): void
    {
    }

    public function failed(\Throwable $e): void
    {
    }
}
