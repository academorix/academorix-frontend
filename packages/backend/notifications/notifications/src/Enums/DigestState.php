<?php

declare(strict_types=1);

namespace Stackra\Notifications\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of a `NotificationDigest` batch.
 *
 * State machine: `Pending` → `Delivering` → `Delivered` OR `Failed`.
 *
 * ## Cases
 *
 *  * {@see self::Pending}    — accumulating notifications.
 *  * {@see self::Delivering} — render + dispatch in progress.
 *  * {@see self::Delivered}  — successfully sent.
 *  * {@see self::Failed}     — dispatch failed; retry exhausted.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DigestState: string
{
    use Enum;

    #[Label('Pending')]
    #[Description('Accumulating notifications for the window.')]
    case Pending = 'pending';

    #[Label('Delivering')]
    #[Description('Render and dispatch in progress.')]
    case Delivering = 'delivering';

    #[Label('Delivered')]
    #[Description('Successfully sent to the recipient.')]
    case Delivered = 'delivered';

    #[Label('Failed')]
    #[Description('Dispatch failed and retries were exhausted.')]
    case Failed = 'failed';
}
