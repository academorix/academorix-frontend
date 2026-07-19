<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of a
 * {@see \Academorix\Newsletter\Models\NewsletterSubscription}.
 *
 * ## Cases
 *
 *  * {@see self::PendingConfirmation} — created; awaiting double-opt-in
 *    confirmation via the signed HMAC token.
 *  * {@see self::Active}     — confirmed + receiving campaigns.
 *  * {@see self::Unsubscribed} — user-initiated unsubscribe.
 *  * {@see self::Bounced}    — hard-bounced by the mail provider; marked
 *    non-deliverable and skipped on future sends.
 *  * {@see self::Complained} — recipient marked the message as spam.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterSubscriptionStatus: string
{
    use Enum;

    /**
     * Pending confirmation — awaiting double-opt-in confirmation.
     */
    #[Label('Pending Confirmation')]
    #[Description('Created; awaiting double-opt-in confirmation via signed token.')]
    case PendingConfirmation = 'pending_confirmation';

    /**
     * Active — confirmed and receiving campaigns.
     */
    #[Label('Active')]
    #[Description('Confirmed and receiving campaigns.')]
    case Active = 'active';

    /**
     * Unsubscribed — user-initiated unsubscribe.
     */
    #[Label('Unsubscribed')]
    #[Description('User-initiated unsubscribe. Retained as CAN-SPAM + CASL evidence.')]
    case Unsubscribed = 'unsubscribed';

    /**
     * Bounced — hard-bounced by the mail provider.
     */
    #[Label('Bounced')]
    #[Description('Hard-bounced by the mail provider. Non-deliverable.')]
    case Bounced = 'bounced';

    /**
     * Complained — recipient reported the message as spam.
     */
    #[Label('Complained')]
    #[Description('Recipient reported the message as spam. Retained as reputation evidence.')]
    case Complained = 'complained';
}
