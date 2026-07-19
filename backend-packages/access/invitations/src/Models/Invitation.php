<?php

declare(strict_types=1);

namespace Academorix\Invitations\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Invitations\Casts\InvitationInviterCast;
use Academorix\Invitations\Casts\InvitationTargetCast;
use Academorix\Invitations\Contracts\Data\InvitationInterface;
use Academorix\Invitations\Contracts\Services\InvitationTargetRegistryInterface;
use Academorix\Invitations\Database\Factories\InvitationFactory;
use Academorix\Invitations\Enums\InvitationChannel;
use Academorix\Invitations\Enums\InvitationStatus;
use Academorix\Invitations\Observers\InvitationObserver;
use Academorix\Invitations\Policies\InvitationPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for an {@see InvitationInterface}.
 *
 * A token-based invitation targeting a polymorphic host (Tenant,
 * Team, Athlete, Federation, TrialSession, ...) issued by a
 * polymorphic inviter (User, ServiceAccount, or the system). The
 * `token_hash` is a SHA-256 of the raw token — the raw token is
 * NEVER persisted; it lives on the model for exactly one turn (the
 * `SendInvitationJob` dispatch) via the transient
 * {@see self::$rawToken} property.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Table(
    name: InvitationInterface::TABLE,
    key: InvitationInterface::PRIMARY_KEY,
    keyType: InvitationInterface::KEY_TYPE,
)]
#[Fillable([
    InvitationInterface::ATTR_APPLICATION_ID,
    InvitationInterface::ATTR_TENANT_ID,
    InvitationInterface::ATTR_TARGET_TYPE,
    InvitationInterface::ATTR_TARGET_ID,
    InvitationInterface::ATTR_INVITER_TYPE,
    InvitationInterface::ATTR_INVITER_ID,
    InvitationInterface::ATTR_EMAIL,
    InvitationInterface::ATTR_CHANNEL,
    InvitationInterface::ATTR_ROLE_KEY,
    InvitationInterface::ATTR_GRANTS,
    InvitationInterface::ATTR_MESSAGE,
    InvitationInterface::ATTR_STATE,
    InvitationInterface::ATTR_TOKEN_HASH,
    InvitationInterface::ATTR_TOKEN_PREFIX,
    InvitationInterface::ATTR_EXPIRES_AT,
    InvitationInterface::ATTR_RESEND_COUNT,
    InvitationInterface::ATTR_LAST_RESENT_AT,
    InvitationInterface::ATTR_SENT_AT,
    InvitationInterface::ATTR_DELIVERED_AT,
    InvitationInterface::ATTR_OPENED_AT,
    InvitationInterface::ATTR_CLICKED_AT,
    InvitationInterface::ATTR_ACCEPTED_AT,
    InvitationInterface::ATTR_ACCEPTED_BY_USER_ID,
    InvitationInterface::ATTR_DECLINED_AT,
    InvitationInterface::ATTR_DECLINED_REASON,
    InvitationInterface::ATTR_EXPIRED_AT,
    InvitationInterface::ATTR_REVOKED_AT,
    InvitationInterface::ATTR_REVOKED_BY_USER_ID,
    InvitationInterface::ATTR_REVOKED_REASON,
    InvitationInterface::ATTR_BOUNCE_KIND,
    InvitationInterface::ATTR_BOUNCE_REASON,
    InvitationInterface::ATTR_METADATA,
])]
#[Hidden([
    InvitationInterface::ATTR_TOKEN_HASH,
])]
#[UseFactory(InvitationFactory::class)]
#[UsePolicy(InvitationPolicy::class)]
#[ObservedBy([InvitationObserver::class])]
#[WithoutIncrementing]
final class Invitation extends Model implements AuditableContract, InvitationInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Transient — the raw (unhashed) token, populated once by the
     * observer on `creating` and consumed once by
     * {@see \Academorix\Invitations\Jobs\SendInvitationJob}. NEVER
     * persisted, NEVER serialised, NEVER returned in a JSON envelope.
     */
    public ?string $rawToken = null;

    /**
     * Cast map — enums + JSON + datetimes coerced on hydrate. The
     * `target_type` cast reaches into the target registry so the
     * stored morph-map key stays canonical; the `inviter_type` cast
     * coerces FQCN legacy writes back to the morph-map key.
     *
     * @var array<string, string>
     */
    protected $casts = [
        InvitationInterface::ATTR_STATE          => InvitationStatus::class,
        InvitationInterface::ATTR_CHANNEL        => InvitationChannel::class,
        InvitationInterface::ATTR_TARGET_TYPE    => InvitationTargetCast::class,
        InvitationInterface::ATTR_INVITER_TYPE   => InvitationInviterCast::class,
        InvitationInterface::ATTR_GRANTS         => 'array',
        InvitationInterface::ATTR_METADATA       => 'array',
        InvitationInterface::ATTR_EXPIRES_AT     => 'datetime',
        InvitationInterface::ATTR_LAST_RESENT_AT => 'datetime',
        InvitationInterface::ATTR_SENT_AT        => 'datetime',
        InvitationInterface::ATTR_DELIVERED_AT   => 'datetime',
        InvitationInterface::ATTR_OPENED_AT      => 'datetime',
        InvitationInterface::ATTR_CLICKED_AT     => 'datetime',
        InvitationInterface::ATTR_ACCEPTED_AT    => 'datetime',
        InvitationInterface::ATTR_DECLINED_AT    => 'datetime',
        InvitationInterface::ATTR_EXPIRED_AT     => 'datetime',
        InvitationInterface::ATTR_REVOKED_AT     => 'datetime',
        InvitationInterface::ATTR_RESEND_COUNT   => 'integer',
    ];

    /**
     * The polymorphic invitable target (Tenant / Team / Athlete /
     * TrialSession / Federation / ...). Concrete class is resolved
     * by {@see InvitationTargetRegistryInterface} at hydrate.
     *
     * @return MorphTo<Model, $this>
     */
    public function target(): MorphTo
    {
        return $this->morphTo(
            name: 'target',
            type: InvitationInterface::ATTR_TARGET_TYPE,
            id: InvitationInterface::ATTR_TARGET_ID,
        );
    }

    /**
     * The polymorphic inviter (User / ServiceAccount / null for
     * `system`).
     *
     * @return MorphTo<Model, $this>
     */
    public function inviter(): MorphTo
    {
        return $this->morphTo(
            name: 'inviter',
            type: InvitationInterface::ATTR_INVITER_TYPE,
            id: InvitationInterface::ATTR_INVITER_ID,
        );
    }

    /**
     * Every audit-funnel event written for this invitation.
     *
     * @return HasMany<InvitationEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(
            InvitationEvent::class,
            \Academorix\Invitations\Contracts\Data\InvitationEventInterface::ATTR_INVITATION_ID,
        );
    }

    /**
     * The User row that resulted from the accept flow. NULL until
     * `state = accepted`. Deliberately typed against the abstract
     * `Model` class-string — the User module owns the concrete class
     * and this module never name-drops it.
     *
     * @return BelongsTo<Model, $this>
     */
    public function acceptedBy(): BelongsTo
    {
        /** @var class-string<Model> $userClass */
        $userClass = 'Academorix\\User\\Models\\User';

        return $this->belongsTo(
            $userClass,
            InvitationInterface::ATTR_ACCEPTED_BY_USER_ID,
        );
    }

    /**
     * The User who revoked. NULL until `state = revoked`.
     *
     * @return BelongsTo<Model, $this>
     */
    public function revokedBy(): BelongsTo
    {
        /** @var class-string<Model> $userClass */
        $userClass = 'Academorix\\User\\Models\\User';

        return $this->belongsTo(
            $userClass,
            InvitationInterface::ATTR_REVOKED_BY_USER_ID,
        );
    }

    /**
     * Whether the invitation is in a non-terminal state. Bounces are
     * considered non-terminal on their own — the observer sets
     * `state = expired` / `state = revoked` when appropriate.
     */
    public function isPending(): bool
    {
        $state = $this->{InvitationInterface::ATTR_STATE};

        $status = $state instanceof InvitationStatus
            ? $state
            : (InvitationStatus::tryFrom((string) $state) ?? InvitationStatus::Pending);

        return $status->isTerminal() === false;
    }

    /**
     * Whether the invitation is past its expiry timestamp.
     */
    public function isExpired(): bool
    {
        $expiresAt = $this->{InvitationInterface::ATTR_EXPIRES_AT};

        return $expiresAt !== null && $expiresAt->isPast();
    }
}
