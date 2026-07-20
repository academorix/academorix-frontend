<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of an `xfer_jobs` row.
 *
 * The observer enforces legal transitions:
 * `queued → running → (completed | partially_succeeded | failed | cancelled)`.
 * Anything else raises `InvalidStateTransitionException`.
 *
 * ## Cases
 *
 *  * {@see self::Queued}             — job created; coordinator not yet started.
 *  * {@see self::Running}            — coordinator or one of its shards is executing.
 *  * {@see self::Completed}          — every shard succeeded.
 *  * {@see self::PartiallySucceeded} — some rows failed; an errors artifact exists.
 *  * {@see self::Failed}             — every shard failed OR a fatal error stopped the run.
 *  * {@see self::Cancelled}          — the tenant cancelled the job.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum XferJobStatus: string
{
    use Enum;

    /**
     * Queued — job row exists; coordinator has not started.
     */
    #[Label('Queued')]
    #[Description('Job row created; the coordinator has not started yet.')]
    case Queued = 'queued';

    /**
     * Running — the coordinator or one of its shards is executing.
     */
    #[Label('Running')]
    #[Description('The coordinator or one of its shards is executing.')]
    case Running = 'running';

    /**
     * Completed — every shard succeeded.
     */
    #[Label('Completed')]
    #[Description('Every shard succeeded.')]
    case Completed = 'completed';

    /**
     * Partially succeeded — some rows failed; an errors artifact exists.
     */
    #[Label('Partially Succeeded')]
    #[Description('Some rows failed. An errors artifact is available for download.')]
    case PartiallySucceeded = 'partially_succeeded';

    /**
     * Failed — every shard failed OR a fatal error stopped the run.
     */
    #[Label('Failed')]
    #[Description('The run failed — every shard errored or a fatal error stopped the coordinator.')]
    case Failed = 'failed';

    /**
     * Cancelled — the tenant cancelled the job.
     */
    #[Label('Cancelled')]
    #[Description('The tenant cancelled the job.')]
    case Cancelled = 'cancelled';

    /**
     * Whether the status is terminal (no further transitions allowed).
     */
    public function isTerminal(): bool
    {
        return match ($this) {
            self::Completed,
            self::PartiallySucceeded,
            self::Failed,
            self::Cancelled => true,
            self::Queued,
            self::Running => false,
        };
    }
}
