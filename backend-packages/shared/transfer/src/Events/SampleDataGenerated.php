<?php

declare(strict_types=1);

namespace Academorix\Transfer\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a `#[SampleData]`-annotated factory has finished
 * inserting sample rows for the target entity.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'transfer.sample.generated')]
final readonly class SampleDataGenerated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  XferJob  $job          The sample-generation job row.
     * @param  int      $recordCount  Number of rows generated.
     */
    public function __construct(
        public XferJob $job,
        public int $recordCount,
    ) {
    }
}
