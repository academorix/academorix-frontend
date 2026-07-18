<?php

declare(strict_types=1);

namespace Academorix\Notifications\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Delivery priority tier for a category.
 *
 * Drives queue routing (critical / transactional → default queue;
 * product / marketing → `notifications-low`), retry budget, and whether
 * digest scheduling can defer the notification.
 *
 * ## Cases
 *
 *  * {@see self::Critical}      — security / life-safety; bypasses digest.
 *  * {@see self::Transactional} — direct action side-effect; opt-out disallowed.
 *  * {@see self::Product}       — feature news; opt-out allowed, on by default.
 *  * {@see self::Marketing}     — promotional; opt-in only.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationPriority: string
{
    use Enum;

    #[Label('Critical')]
    #[Description('Security or life-safety notifications. Bypasses digest and quiet hours.')]
    case Critical = 'critical';

    #[Label('Transactional')]
    #[Description('Direct side-effect of a user action. Opt-out disallowed.')]
    case Transactional = 'transactional';

    #[Label('Product')]
    #[Description('Product news and feature announcements. Opt-out allowed, on by default.')]
    case Product = 'product';

    #[Label('Marketing')]
    #[Description('Promotional content. Opt-in only.')]
    case Marketing = 'marketing';
}
