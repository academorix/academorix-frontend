<?php

declare(strict_types=1);

namespace Stackra\Invitations\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Invitations module contributes.
 *
 * Dual-guard — the `sanctum` guard covers tenant-scoped
 * management (view / send / resend / revoke); the `platform_admin`
 * guard covers cross-tenant audit + revoke for Stackra ops
 * (abuse investigation, support tickets).
 *
 * No `Accept` / `Decline` permission ships — the token IS the
 * authorization for those flows and the endpoints are public.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum InvitationsPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `invitations.viewAny` — list + show invitations in the caller's tenant.
     */
    #[Label('View Invitations')]
    #[Description('List and show invitations owned by the caller\'s tenant.')]
    case ViewAny = 'invitations.viewAny';

    /**
     * `invitations.send` — create a new invitation.
     */
    #[Label('Send Invitations')]
    #[Description('Create and dispatch a new invitation.')]
    case Send = 'invitations.send';

    /**
     * `invitations.resend` — regenerate a token and re-dispatch a pending invitation.
     */
    #[Label('Resend Invitations')]
    #[Description('Regenerate the token and re-dispatch a pending invitation.')]
    case Resend = 'invitations.resend';

    /**
     * `invitations.revoke` — revoke a non-terminal invitation.
     */
    #[Label('Revoke Invitations')]
    #[Description('Revoke a non-terminal invitation for the caller\'s tenant.')]
    case Revoke = 'invitations.revoke';

    /**
     * `invitations.manage_any` — cross-tenant read + audit-revoke for Stackra ops.
     */
    #[Label('Manage Invitations (platform)')]
    #[Description('Cross-tenant read and audit-revoke for platform support and abuse response.')]
    case ManageAny = 'invitations.manage_any';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::ViewAny,
            self::Send,
            self::Resend,
            self::Revoke    => Guard::Sanctum,
            self::ManageAny => Guard::PlatformAdmin,
        };
    }
}
