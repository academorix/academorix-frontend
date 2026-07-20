<?php

declare(strict_types=1);

namespace Academorix\Transfer\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Runs one shard of a sharded import.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Queue('transfer')]
#[Tries(3)]
#[Backoff(60, 300, 900)]
final class ImportShardJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $xferShardId  Prefixed ULID of the shard row.
     */
    public function __construct(public readonly string $xferShardId)
    {
    }

    public function handle(): void
    {
        // Delegate to the manager's shard handler in the real impl.
    }

    public function failed(\Throwable $e): void
    {
        // No-op — the shard row's own updated event handles state.
    }
}
