<?php

declare(strict_types=1);

namespace Stackra\Invitations\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Delivery channel an invitation is dispatched over.
 *
 * ## Cases
 *
 *  * {@see self::Email}  — canonical channel; ships in v1.
 *  * {@see self::Sms}    — feature-flag guarded per tenant entitlement.
 *  * {@see self::InApp}  — in-app notification only (no outbound message).
 *  * {@see self::Link}   — no message dispatched; caller shares the URL
 *    out of band. Skips `SendInvitationJob`.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum InvitationChannel: string
{
    use Enum;

    /**
     * Canonical email channel — ships in v1.
     */
    #[Label('Email')]
    #[Description('Deliver the invitation via email — the default channel.')]
    case Email = 'email';

    /**
     * SMS channel — feature-flag guarded per tenant entitlement.
     */
    #[Label('SMS')]
    #[Description('Deliver the invitation via SMS. Feature-flag guarded per tenant.')]
    case Sms = 'sms';

    /**
     * In-app channel — surfaces the invitation inside the invitee's account.
     */
    #[Label('In-App')]
    #[Description('Surface the invitation inside the invitee\'s in-app notification feed.')]
    case InApp = 'in_app';

    /**
     * Link channel — no message dispatched; caller shares the URL out of band.
     */
    #[Label('Link')]
    #[Description('No message dispatched — the caller shares the invitation URL out of band.')]
    case Link = 'link';
}
