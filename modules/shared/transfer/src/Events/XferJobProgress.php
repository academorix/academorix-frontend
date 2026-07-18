<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Broadcast-only progress update — NOT afterCommit; NOT audit-worthy.
 *
 * Fires every `config('transfer.progress.every_rows')` rows within a
 * chunk or on every shard completion, whichever triggers first.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.progress')]
final readonly class XferJobProgress
{
    use Dispatchable;

    /**
     * @param  string                $xferJobId        Prefixed ULID.
     * @param  int                   $progressPercent  0–100.
     * @param  array<string, int>    $counters         Rolled-up counters.
     */
    public function __construct(
        public string $xferJobId,
        public int $progressPercent,
        public array $counters,
    ) {
    }
}
