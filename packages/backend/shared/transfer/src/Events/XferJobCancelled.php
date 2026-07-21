<?php

declare(strict_types=1);

namespace Stackra\Transfer\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Transfer\Models\XferJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a {@see XferJob} transitions to `cancelled`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.cancelled')]
final readonly class XferJobCancelled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferJob  $job  The cancelled job.
     */
    public function __construct(public XferJob $job)
    {
    }
}
