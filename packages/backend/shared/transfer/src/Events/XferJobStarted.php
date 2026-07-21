<?php

declare(strict_types=1);

namespace Stackra\Transfer\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a {@see XferJob} transitions from queued → running.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.started')]
final readonly class XferJobStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferJob  $job  The job that started.
     */
    public function __construct(public XferJob $job)
    {
    }
}
