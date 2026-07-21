<?php

declare(strict_types=1);

namespace Stackra\Invitations\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of an {@see \Stackra\Invitations\Models\Invitation}.
 *
 * ## Cases
 *
 *  * {@see self::Pending}   — created and stored; outbound message not yet
 *    accepted by the transport.
 *  * {@see self::Delivered} — mail transport reported successful delivery.
 *  * {@see self::Opened}    — invitee opened the message (tracking pixel).
 *  * {@see self::Clicked}   — invitee visited the preview endpoint.
 *  * {@see self::Accepted}  — terminal success — the accept flow completed.
 *  * {@see self::Declined}  — terminal decline chosen by the invitee.
 *  * {@see self::Expired}   — terminal — `expires_at` passed before accept.
 *  * {@see self::Revoked}   — terminal — manually cancelled by the inviter
 *    or a platform admin.
 *  * {@see self::Bounced}   — mail transport rejected delivery; may be
 *    terminal (hard bounce / complaint) or transient (soft bounce, retryable).
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum InvitationStatus: string
{
    use Enum;

    /**
     * Created and stored; outbound message not yet accepted by the transport.
     */
    #[Label('Pending')]
    #[Description('Invitation was created but the transport has not yet accepted the message.')]
    case Pending = 'pending';

    /**
     * Mail transport reported successful delivery.
     */
    #[Label('Delivered')]
    #[Description('Mail transport reported successful delivery to the invitee\'s inbox.')]
    case Delivered = 'delivered';

    /**
     * Invitee opened the message (tracking pixel loaded).
     */
    #[Label('Opened')]
    #[Description('Invitee opened the message — the tracking pixel or preview endpoint was hit.')]
    case Opened = 'opened';

    /**
     * Invitee visited the preview endpoint (`GET /api/invitations/{token}`).
     */
    #[Label('Clicked')]
    #[Description('Invitee visited the invitation preview endpoint.')]
    case Clicked = 'clicked';

    /**
     * Terminal success — the accept flow completed.
     */
    #[Label('Accepted')]
    #[Description('Terminal success — the invitee completed the accept flow.')]
    case Accepted = 'accepted';

    /**
     * Terminal decline chosen by the invitee.
     */
    #[Label('Declined')]
    #[Description('Terminal — invitee explicitly declined the invitation.')]
    case Declined = 'declined';

    /**
     * Terminal — `expires_at` passed before accept.
     */
    #[Label('Expired')]
    #[Description('Terminal — invitation expired before the invitee accepted or declined.')]
    case Expired = 'expired';

    /**
     * Terminal — manually cancelled by the inviter or a platform admin.
     */
    #[Label('Revoked')]
    #[Description('Terminal — manually cancelled by the inviter or platform admin.')]
    case Revoked = 'revoked';

    /**
     * Bounced — soft bounce is retryable; hard bounce and complaint are terminal.
     */
    #[Label('Bounced')]
    #[Description('Mail transport rejected the message. Soft bounces may retry; hard bounces + complaints are terminal.')]
    case Bounced = 'bounced';

    /**
     * Whether the state is terminal — no further transitions allowed.
     *
     * Bounces are considered non-terminal here — {@see \Stackra\Invitations\Models\Invitation}
     * tracks the hard/soft distinction via `bounce_kind` and only hard
     * bounces + complaints stop retry.
     */
    public function isTerminal(): bool
    {
        return match ($this) {
            self::Accepted,
            self::Declined,
            self::Expired,
            self::Revoked => true,

            self::Pending,
            self::Delivered,
            self::Opened,
            self::Clicked,
            self::Bounced => false,
        };
    }
}
