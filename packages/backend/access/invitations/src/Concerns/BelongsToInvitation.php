<?php

declare(strict_types=1);

namespace Stackra\Invitations\Concerns;

use Stackra\Invitations\Contracts\Data\InvitationInterface;
use Stackra\Invitations\Models\Invitation;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Composed on models created FROM an invitation.
 *
 * Adds a nullable `invitation_id` FK + a `BelongsTo` relation for
 * provenance / traceability. Primary consumer: the User row that
 * results from `acceptInvitation()` gets its origin invitation
 * stamped for audit ("this user was invited by X on Y date via
 * role Z").
 *
 * Composing model must declare `invitation_id` in its migration
 * (see `traits.json` → `BelongsToInvitation`) — this trait only
 * wires the relation.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
trait BelongsToInvitation
{
    /**
     * The invitation that originated this record.
     *
     * @return BelongsTo<Invitation, $this>
     */
    public function originInvitation(): BelongsTo
    {
        return $this->belongsTo(
            Invitation::class,
            'invitation_id',
            InvitationInterface::ATTR_ID,
        );
    }
}
