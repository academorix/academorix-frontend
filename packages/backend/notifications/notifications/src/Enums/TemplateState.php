<?php

declare(strict_types=1);

namespace Stackra\Notifications\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of a `NotificationTemplate`.
 *
 * Publish workflow: `Draft` → `Published`. Archived templates are
 * retained for SOC 2 CC8.1 change-management evidence but never
 * resolved at dispatch time.
 *
 * ## Cases
 *
 *  * {@see self::Draft}      — authored, not yet dispatched.
 *  * {@see self::Published}  — active; resolvable at dispatch time.
 *  * {@see self::Archived}   — retired; retained for evidence.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TemplateState: string
{
    use Enum;

    #[Label('Draft')]
    #[Description('Authored but not yet published. Not dispatchable.')]
    case Draft = 'draft';

    #[Label('Published')]
    #[Description('Active — resolvable at dispatch time.')]
    case Published = 'published';

    #[Label('Archived')]
    #[Description('Retired — retained for change-management evidence.')]
    case Archived = 'archived';
}
