<?php

declare(strict_types=1);

namespace Academorix\Localization\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of a {@see \Academorix\Localization\Models\TranslationJob}.
 *
 * ## Cases
 *
 *  * {@see self::Queued}    — dispatched, not yet started by a worker.
 *  * {@see self::Running}   — worker fanning out `TranslateJob`s.
 *  * {@see self::Completed} — every child job resolved (success or fail).
 *  * {@see self::Failed}    — retries exhausted at the bulk parent.
 *  * {@see self::Cancelled} — operator cancelled via the API / console.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TranslationJobStatus: string
{
    use Enum;

    #[Label('Queued')]
    #[Description('Dispatched to the queue but not yet started by a worker.')]
    case Queued = 'queued';

    #[Label('Running')]
    #[Description('The bulk parent is fanning out child TranslateJob dispatches.')]
    case Running = 'running';

    #[Label('Completed')]
    #[Description('Every child job resolved — success + failure counts are final.')]
    case Completed = 'completed';

    #[Label('Failed')]
    #[Description('Retries exhausted at the bulk parent — the child jobs may or may not have run.')]
    case Failed = 'failed';

    #[Label('Cancelled')]
    #[Description('An operator cancelled the job via the API or console command.')]
    case Cancelled = 'cancelled';
}
