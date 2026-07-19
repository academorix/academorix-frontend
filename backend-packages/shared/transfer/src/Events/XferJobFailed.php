<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a {@see XferJob} transitions to `failed`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.job.failed')]
final readonly class XferJobFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferJob  $job  The failed job.
     */
    public function __construct(public XferJob $job)
    {
    }
}
