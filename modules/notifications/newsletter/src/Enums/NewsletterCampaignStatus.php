<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of a
 * {@see \Academorix\Newsletter\Models\NewsletterCampaign}.
 *
 * ## Cases
 *
 *  * {@see self::Pending}    — scheduled; not yet dispatched.
 *  * {@see self::InProgress} — orchestrator started; batches in flight.
 *  * {@see self::Completed}  — every batch completed.
 *  * {@see self::Cancelled}  — cancelled before completion.
 *  * {@see self::Failed}     — fatal error during orchestration.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterCampaignStatus: string
{
    use Enum;

    /**
     * Pending — scheduled, not yet dispatched.
     */
    #[Label('Pending')]
    #[Description('Scheduled; not yet dispatched.')]
    case Pending = 'pending';

    /**
     * In progress — orchestrator started; batches in flight.
     */
    #[Label('In Progress')]
    #[Description('Orchestrator started; batches in flight.')]
    case InProgress = 'in_progress';

    /**
     * Completed — every batch completed successfully.
     */
    #[Label('Completed')]
    #[Description('Every batch completed successfully.')]
    case Completed = 'completed';

    /**
     * Cancelled — cancelled before completion.
     */
    #[Label('Cancelled')]
    #[Description('Cancelled before completion.')]
    case Cancelled = 'cancelled';

    /**
     * Failed — fatal error during orchestration.
     */
    #[Label('Failed')]
    #[Description('Fatal error during orchestration.')]
    case Failed = 'failed';
}
