<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of a {@see \Academorix\Newsletter\Models\NewsletterIssue}.
 *
 * ## Cases
 *
 *  * {@see self::Draft}     — editorial in progress; not yet scheduled.
 *  * {@see self::Scheduled} — scheduled for send at a specific time; the
 *    matching {@see \Academorix\Newsletter\Models\NewsletterCampaign} has
 *    been created.
 *  * {@see self::Sending}   — the campaign job is dispatching batches.
 *  * {@see self::Sent}      — the campaign completed successfully; the
 *    row is now historical evidence and NEVER editable.
 *  * {@see self::Cancelled} — cancelled before send.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterIssueStatus: string
{
    use Enum;

    /**
     * Draft — editorial in progress; not yet scheduled.
     */
    #[Label('Draft')]
    #[Description('Editorial in progress. Not yet scheduled for send.')]
    case Draft = 'draft';

    /**
     * Scheduled — scheduled for send at a specific time.
     */
    #[Label('Scheduled')]
    #[Description('Scheduled for send at a specific time; matching campaign exists.')]
    case Scheduled = 'scheduled';

    /**
     * Sending — the campaign is dispatching batches.
     */
    #[Label('Sending')]
    #[Description('The campaign is dispatching send batches.')]
    case Sending = 'sending';

    /**
     * Sent — the campaign completed successfully.
     */
    #[Label('Sent')]
    #[Description('Campaign completed successfully. Row is now historical evidence.')]
    case Sent = 'sent';

    /**
     * Cancelled — cancelled before send.
     */
    #[Label('Cancelled')]
    #[Description('Cancelled before or during send.')]
    case Cancelled = 'cancelled';
}
