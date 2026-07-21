<?php

declare(strict_types=1);

namespace Stackra\Subscription\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Database\Factories\SubscriptionFactory;
use Stackra\Subscription\Enums\BillingCycle;
use Stackra\Subscription\Enums\SubscriptionProvider;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Observers\SubscriptionObserver;
use Stackra\Subscription\Policies\SubscriptionPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SubscriptionInterface}.
 *
 * Tenant's active subscription. Composes `BelongsToTenant` so every
 * read/write auto-scopes to the active tenant. `HasAudit` is
 * critical for SOX 404 — every state change on this row must be
 * auditable evidence.
 *
 * ## Notes
 *
 *  * Provider fields (`provider_subscription_id`,
 *    `provider_customer_id`) hold Cashier's own identifiers so we
 *    can cross-reference back to the payment provider without a
 *    lookup table.
 *  * `grace_ends_at` extends the provider's default lifecycle —
 *    computed by {@see \Stackra\Subscription\Services\DefaultGracePeriodResolver}
 *    at every state transition.
 *  * `consecutive_failures` feeds the DunningOrchestrator's
 *    stage-advancement logic.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Table(
    name: SubscriptionInterface::TABLE,
    key: SubscriptionInterface::PRIMARY_KEY,
    keyType: SubscriptionInterface::KEY_TYPE,
)]
#[Fillable([
    SubscriptionInterface::ATTR_TENANT_ID,
    SubscriptionInterface::ATTR_APPLICATION_ID,
    SubscriptionInterface::ATTR_PLAN_ID,
    SubscriptionInterface::ATTR_PROVIDER,
    SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID,
    SubscriptionInterface::ATTR_PROVIDER_CUSTOMER_ID,
    SubscriptionInterface::ATTR_STATE,
    SubscriptionInterface::ATTR_BILLING_CYCLE,
    SubscriptionInterface::ATTR_TRIAL_ENDS_AT,
    SubscriptionInterface::ATTR_CURRENT_PERIOD_START,
    SubscriptionInterface::ATTR_CURRENT_PERIOD_END,
    SubscriptionInterface::ATTR_GRACE_ENDS_AT,
    SubscriptionInterface::ATTR_SUSPENDED_AT,
    SubscriptionInterface::ATTR_CANCELLED_AT,
    SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END,
    SubscriptionInterface::ATTR_REINSTATED_AT,
    SubscriptionInterface::ATTR_LAST_PAYMENT_AT,
    SubscriptionInterface::ATTR_LAST_PAYMENT_FAILED_AT,
    SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES,
    SubscriptionInterface::ATTR_METADATA,
])]
#[UseFactory(SubscriptionFactory::class)]
#[UsePolicy(SubscriptionPolicy::class)]
#[ObservedBy([SubscriptionObserver::class])]
#[WithoutIncrementing]
final class Subscription extends Model implements AuditableContract, SubscriptionInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SubscriptionInterface::ATTR_STATE                    => SubscriptionState::class,
        SubscriptionInterface::ATTR_PROVIDER                 => SubscriptionProvider::class,
        SubscriptionInterface::ATTR_BILLING_CYCLE            => BillingCycle::class,
        SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END     => 'boolean',
        SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES     => 'integer',
        SubscriptionInterface::ATTR_TRIAL_ENDS_AT            => 'datetime',
        SubscriptionInterface::ATTR_CURRENT_PERIOD_START     => 'datetime',
        SubscriptionInterface::ATTR_CURRENT_PERIOD_END       => 'datetime',
        SubscriptionInterface::ATTR_GRACE_ENDS_AT            => 'datetime',
        SubscriptionInterface::ATTR_SUSPENDED_AT             => 'datetime',
        SubscriptionInterface::ATTR_CANCELLED_AT             => 'datetime',
        SubscriptionInterface::ATTR_REINSTATED_AT            => 'datetime',
        SubscriptionInterface::ATTR_LAST_PAYMENT_AT          => 'datetime',
        SubscriptionInterface::ATTR_LAST_PAYMENT_FAILED_AT   => 'datetime',
    ];

    /**
     * The subscription's plan.
     *
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(
            Plan::class,
            SubscriptionInterface::ATTR_PLAN_ID,
        );
    }

    /**
     * Audit-material state transition events for this subscription.
     *
     * @return HasMany<SubscriptionEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(
            SubscriptionEvent::class,
            \Stackra\Subscription\Contracts\Data\SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID,
        );
    }

    /**
     * Whether the subscription is in a paying state (active or
     * inside the trial window).
     */
    public function isActive(): bool
    {
        $state = $this->{SubscriptionInterface::ATTR_STATE};

        return $state === SubscriptionState::Active
            || $state === SubscriptionState::Active->value
            || $state === SubscriptionState::Trialing
            || $state === SubscriptionState::Trialing->value;
    }

    /**
     * Whether the subscription is inside its trial window.
     */
    public function isOnTrial(): bool
    {
        $state = $this->{SubscriptionInterface::ATTR_STATE};
        $trialEndsAt = $this->{SubscriptionInterface::ATTR_TRIAL_ENDS_AT};

        if (! ($state === SubscriptionState::Trialing || $state === SubscriptionState::Trialing->value)) {
            return false;
        }

        return $trialEndsAt !== null && $trialEndsAt->isFuture();
    }

    /**
     * Whether the subscription is inside its restrictive grace band.
     */
    public function isInGrace(): bool
    {
        $state = $this->{SubscriptionInterface::ATTR_STATE};

        return $state === SubscriptionState::Grace
            || $state === SubscriptionState::Grace->value;
    }

    /**
     * Whether the tenant is suspended.
     */
    public function isSuspended(): bool
    {
        $state = $this->{SubscriptionInterface::ATTR_STATE};

        return $state === SubscriptionState::Suspended
            || $state === SubscriptionState::Suspended->value;
    }
}
