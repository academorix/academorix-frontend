<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a new {@see XferJob} row is persisted (status = queued).
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.queued')]
final readonly class XferJobQueued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferJob  $job  The persisted job row.
     */
    public function __construct(public XferJob $job)
    {
    }
}
