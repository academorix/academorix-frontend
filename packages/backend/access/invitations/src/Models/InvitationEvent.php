<?php

declare(strict_types=1);

namespace Stackra\Invitations\Models;

use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Invitations\Contracts\Data\InvitationEventInterface;
use Stackra\Invitations\Contracts\Data\InvitationInterface;
use Stackra\Invitations\Database\Factories\InvitationEventFactory;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Eloquent model for an {@see InvitationEventInterface}.
 *
 * Append-only audit-funnel row — one per state transition or
 * transport signal (`sent`, `delivered`, `opened`, `clicked`,
 * `accepted`, `declined`, `expired`, `revoked`, `bounced`,
 * `resent`, `preflight_failed`). Written by the
 * {@see \Stackra\Invitations\Observers\InvitationObserver} and
 * the {@see \Stackra\Invitations\Jobs\RecordInboundEventJob}.
 *
 * `SoftDeletes` is intentionally NOT applied — events are deleted
 * only by the retention purge, never by user action.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Table(
    name: InvitationEventInterface::TABLE,
    key: InvitationEventInterface::PRIMARY_KEY,
    keyType: InvitationEventInterface::KEY_TYPE,
)]
#[Fillable([
    InvitationEventInterface::ATTR_INVITATION_ID,
    InvitationEventInterface::ATTR_APPLICATION_ID,
    InvitationEventInterface::ATTR_TENANT_ID,
    InvitationEventInterface::ATTR_EVENT,
    InvitationEventInterface::ATTR_OCCURRED_AT,
    InvitationEventInterface::ATTR_ACTOR_TYPE,
    InvitationEventInterface::ATTR_ACTOR_ID,
    InvitationEventInterface::ATTR_TRANSPORT,
    InvitationEventInterface::ATTR_SIGNAL_ID,
    InvitationEventInterface::ATTR_IP_ADDRESS,
    InvitationEventInterface::ATTR_USER_AGENT,
    InvitationEventInterface::ATTR_COUNTRY_CODE,
    InvitationEventInterface::ATTR_CITY,
    InvitationEventInterface::ATTR_ERROR_CODE,
    InvitationEventInterface::ATTR_ERROR_MESSAGE,
    InvitationEventInterface::ATTR_METADATA,
])]
#[UseFactory(InvitationEventFactory::class)]
#[WithoutIncrementing]
final class InvitationEvent extends Model implements InvitationEventInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;

    /**
     * `InvitationEvent` rows carry a single `created_at` timestamp
     * only — the transport / signal captures `occurred_at`
     * separately.
     */
    public $timestamps = false;

    /**
     * Cast map — JSON + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        InvitationEventInterface::ATTR_OCCURRED_AT => 'datetime',
        InvitationEventInterface::ATTR_CREATED_AT  => 'datetime',
        InvitationEventInterface::ATTR_METADATA    => 'array',
    ];

    /**
     * Parent invitation.
     *
     * @return BelongsTo<Invitation, $this>
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(
            Invitation::class,
            InvitationEventInterface::ATTR_INVITATION_ID,
            InvitationInterface::ATTR_ID,
        );
    }

    /**
     * The actor that triggered this event — a user, service account,
     * platform system, or an external mail-transport / webhook.
     *
     * @return MorphTo<Model, $this>
     */
    public function actor(): MorphTo
    {
        return $this->morphTo(
            name: 'actor',
            type: InvitationEventInterface::ATTR_ACTOR_TYPE,
            id: InvitationEventInterface::ATTR_ACTOR_ID,
        );
    }
}
