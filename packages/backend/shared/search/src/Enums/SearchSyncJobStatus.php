<?php

declare(strict_types=1);

namespace Stackra\Search\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * State machine for `SearchSyncJob`.
 *
 * Transitions are enforced by `SearchSyncJobObserver`:
 *   queued → running → { succeeded | partially_succeeded | failed | cancelling }
 *   cancelling → cancelled
 *   terminals are terminal.
 *
 * ## Cases
 *
 *  * {@see self::Queued}              — created, waiting to run.
 *  * {@see self::Running}             — a coordinator is dispatching shards.
 *  * {@see self::Cancelling}          — cancel requested; running shards
 *    bail out on the next boundary.
 *  * {@see self::Succeeded}           — every shard succeeded.
 *  * {@see self::PartiallySucceeded}  — some shards failed but the job
 *    completed enough to be usable; alias swap is skipped.
 *  * {@see self::Failed}              — every shard failed OR a
 *    coordinator-level failure prevented completion.
 *  * {@see self::Cancelled}           — cancellation acknowledged.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SearchSyncJobStatus: string
{
    use Enum;

    #[Label('Queued')]
    #[Description('Created, waiting for the worker to pick it up.')]
    case Queued = 'queued';

    #[Label('Running')]
    #[Description('Coordinator is dispatching shards and aggregating progress.')]
    case Running = 'running';

    #[Label('Cancelling')]
    #[Description('Cancel requested; running shards bail out on the next boundary.')]
    case Cancelling = 'cancelling';

    #[Label('Succeeded')]
    #[Description('Every shard completed successfully; alias swap is next.')]
    case Succeeded = 'succeeded';

    #[Label('Partially Succeeded')]
    #[Description('Some shards failed but the job completed enough to be usable; alias swap is skipped.')]
    case PartiallySucceeded = 'partially_succeeded';

    #[Label('Failed')]
    #[Description('Every shard failed or a coordinator-level failure prevented completion.')]
    case Failed = 'failed';

    #[Label('Cancelled')]
    #[Description('Cancellation acknowledged.')]
    case Cancelled = 'cancelled';
}
