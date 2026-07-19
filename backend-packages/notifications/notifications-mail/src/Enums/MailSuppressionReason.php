<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Why an address was placed on the mail suppression list.
 *
 * Each reason has different persistence + retention semantics — the
 * retention pruner branches on this value, and the delete policy
 * refuses hard-bounce / complaint / spam-trap revocation without
 * `--force` + super_admin authorization.
 *
 * ## Cases
 *
 *   * {@see self::HardBounce}      — provider reported a permanent
 *     bounce. Retained forever; address is invalid.
 *   * {@see self::SoftBounce}      — provider reported a transient
 *     bounce. Retained N days (see
 *     `notifications-mail.suppression.soft_bounce_expiry_days`) then
 *     auto-pruned.
 *   * {@see self::Complaint}       — recipient marked a previous
 *     message as spam. Retained P5Y for CAN-SPAM + CASL evidence.
 *   * {@see self::Unsubscribed}    — recipient clicked the
 *     one-click / List-Unsubscribe link. Follows the user account
 *     lifecycle; erased on UserErased.
 *   * {@see self::Manual}          — admin manually blocked the
 *     address. Tenant-scoped; deletable by tenant admin.
 *   * {@see self::SpamTrap}        — known spam-trap domain seeded
 *     platform-wide. `is_system=true`, retained forever, deletable
 *     only by super_admin.
 *   * {@see self::InvalidAddress}  — provider rejected the address
 *     as malformed before send.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum MailSuppressionReason: string
{
    use Enum;

    /**
     * Permanent bounce — the address does not exist.
     */
    #[Label('Hard Bounce')]
    #[Description('The recipient address permanently rejected the message. Retained forever; address is invalid.')]
    case HardBounce = 'hard_bounce';

    /**
     * Transient bounce — retry-eligible up to N days.
     */
    #[Label('Soft Bounce')]
    #[Description('The recipient address transiently rejected the message. Auto-pruned when the expiry window elapses.')]
    case SoftBounce = 'soft_bounce';

    /**
     * Spam complaint / feedback loop — retained P5Y for evidence.
     */
    #[Label('Complaint')]
    #[Description('The recipient marked a previous message as spam. Retained 5 years for CAN-SPAM / CASL evidence.')]
    case Complaint = 'complaint';

    /**
     * Recipient clicked List-Unsubscribe.
     */
    #[Label('Unsubscribed')]
    #[Description('The recipient unsubscribed via a footer / List-Unsubscribe link. Follows the user account lifecycle.')]
    case Unsubscribed = 'unsubscribed';

    /**
     * Tenant admin manually blocked the address.
     */
    #[Label('Manual')]
    #[Description('An admin manually added the address to the tenant suppression list. Deletable by tenant admin.')]
    case Manual = 'manual';

    /**
     * Known spam-trap domain — platform-wide protection.
     */
    #[Label('Spam Trap')]
    #[Description('Known spam-trap domain. Platform-wide `is_system=true` row. Deletable only by super_admin.')]
    case SpamTrap = 'spam_trap';

    /**
     * Provider rejected the address as malformed at send.
     */
    #[Label('Invalid Address')]
    #[Description('Provider rejected the address as malformed before send.')]
    case InvalidAddress = 'invalid_address';
}
