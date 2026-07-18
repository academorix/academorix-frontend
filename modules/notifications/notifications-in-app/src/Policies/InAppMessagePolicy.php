<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Policies;

use Academorix\Notifications\Enums\NotificationsPermission;
use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Models\InAppMessage;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see InAppMessage}.
 *
 * Every route through this module authorizes on the PARENT
 * notifications module's permissions (`notifications.viewOwn`,
 * `notifications.markSeen`) — the in-app transport reuses the base
 * inbox permissions per blueprint `permissions.json` §reused_from_parent.
 *
 * A caller can view / mark-read an in-app message ONLY when the row
 * belongs to their own tenant AND the addressee_id matches their own
 * user id. Cross-tenant reads return `false` (which the controller
 * translates to 404 rather than 403 to avoid enumeration).
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class InAppMessagePolicy
{
    /**
     * `viewAny` — list the inbox. Grant to any caller with the base
     * `notifications.viewAny` permission; the query itself is scoped
     * to the caller's addressee id (see the list action).
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::ViewAny->value);
    }

    /**
     * `view` — read one message. Grants when the caller owns the row
     * — same tenant + same addressee id.
     */
    public function view(Authenticatable $user, InAppMessage $message): bool
    {
        return $this->callerOwnsMessage($user, $message)
            && $user->can(NotificationsPermission::View->value);
    }

    /**
     * `markRead` — set `read_at`. Idempotent + only the owner may
     * mark read (a support admin should never mark another user's
     * message read on their behalf).
     */
    public function markRead(Authenticatable $user, InAppMessage $message): bool
    {
        return $this->callerOwnsMessage($user, $message)
            && $user->can(NotificationsPermission::MarkSeen->value);
    }

    /**
     * `markAllRead` — bulk mark-read for the caller's own inbox.
     * Grant to any caller with the base mark-seen permission; the
     * repository scopes the write to `addressee_id = $user->id`.
     */
    public function markAllRead(Authenticatable $user): bool
    {
        return $user->can(NotificationsPermission::MarkSeen->value);
    }

    /**
     * Ownership check — the caller must be in the same tenant AND
     * be the addressee of the row. Belt-and-braces defence around
     * `BelongsToTenant`'s global scope (tenant filter already applied
     * on read, but the addressee check narrows further).
     */
    private function callerOwnsMessage(Authenticatable $user, InAppMessage $message): bool
    {
        $rowTenantId = $message->{InAppMessageInterface::ATTR_TENANT_ID} ?? null;
        $rowAddressee = $message->{InAppMessageInterface::ATTR_ADDRESSEE_ID} ?? null;

        $userTenantId = $user->getAttribute('tenant_id');
        $userKey      = $user->getAuthIdentifier();

        if ($rowTenantId === null || $rowAddressee === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId
            && (string) $rowAddressee === (string) $userKey;
    }
}
