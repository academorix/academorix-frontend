<?php

declare(strict_types=1);

namespace Stackra\Subscription\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Database\Factories\PlanFactory;
use Stackra\Subscription\Enums\BillingCycle;
use Stackra\Subscription\Enums\BillingMode;
use Stackra\Subscription\Enums\PlanTier;
use Stackra\Subscription\Observers\PlanObserver;
use Stackra\Subscription\Policies\PlanPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see PlanInterface}.
 *
 * Per-Application plan definition. Maps to a Stripe Price or Paddle
 * Product ID via `provider_price_id`. `default_entitlements` seeds
 * the entitlements module when a tenant subscribes.
 *
 * ## Notes
 *
 *  * No `BelongsToTenant` — plans are Application-scoped rather than
 *    tenant-scoped. The catalogue is shared across every tenant on
 *    the same Application.
 *  * `is_system=true` marks rows that should never be modified from
 *    the admin surface; the observer refuses mutation on those rows
 *    outside a seed context.
 *  * The `active_subscription_count` accessor is intentionally
 *    NOT auto-computed — the platform policy calls the repository
 *    explicitly during `platformArchive()` to decide whether the
 *    delete is safe.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Table(
    name: PlanInterface::TABLE,
    key: PlanInterface::PRIMARY_KEY,
    keyType: PlanInterface::KEY_TYPE,
)]
#[Fillable([
    PlanInterface::ATTR_APPLICATION_ID,
    PlanInterface::ATTR_KEY,
    PlanInterface::ATTR_NAME,
    PlanInterface::ATTR_DESCRIPTION,
    PlanInterface::ATTR_TIER,
    PlanInterface::ATTR_BILLING_CYCLE,
    PlanInterface::ATTR_BILLING_MODE,
    PlanInterface::ATTR_PRICE_MICRO_UNITS,
    PlanInterface::ATTR_CURRENCY,
    PlanInterface::ATTR_PROVIDER_PRICE_ID,
    PlanInterface::ATTR_TRIAL_DAYS,
    PlanInterface::ATTR_DEFAULT_ENTITLEMENTS,
    PlanInterface::ATTR_INCLUDED_FEATURES,
    PlanInterface::ATTR_IS_SYSTEM,
    PlanInterface::ATTR_IS_PUBLIC,
    PlanInterface::ATTR_IS_DEPRECATED,
    PlanInterface::ATTR_SORT_ORDER,
    PlanInterface::ATTR_ARCHIVED_AT,
    PlanInterface::ATTR_METADATA,
])]
#[UseFactory(PlanFactory::class)]
#[UsePolicy(PlanPolicy::class)]
#[ObservedBy([PlanObserver::class])]
#[WithoutIncrementing]
final class Plan extends Model implements AuditableContract, PlanInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON arrays + booleans + datetimes coerced
     * on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        PlanInterface::ATTR_TIER                 => PlanTier::class,
        PlanInterface::ATTR_BILLING_CYCLE        => BillingCycle::class,
        PlanInterface::ATTR_BILLING_MODE         => BillingMode::class,
        PlanInterface::ATTR_PRICE_MICRO_UNITS    => 'integer',
        PlanInterface::ATTR_TRIAL_DAYS           => 'integer',
        PlanInterface::ATTR_DEFAULT_ENTITLEMENTS => 'array',
        PlanInterface::ATTR_INCLUDED_FEATURES    => 'array',
        PlanInterface::ATTR_IS_SYSTEM            => 'boolean',
        PlanInterface::ATTR_IS_PUBLIC            => 'boolean',
        PlanInterface::ATTR_IS_DEPRECATED        => 'boolean',
        PlanInterface::ATTR_SORT_ORDER           => 'integer',
        PlanInterface::ATTR_ARCHIVED_AT          => 'datetime',
    ];

    /**
     * Subscriptions on this plan.
     *
     * @return HasMany<Subscription, $this>
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(
            Subscription::class,
            \Stackra\Subscription\Contracts\Data\SubscriptionInterface::ATTR_PLAN_ID,
        );
    }

    /**
     * Whether the plan is still bookable — not archived, not
     * deprecated, and its `is_public` flag agrees with the caller
     * audience (platform admins bypass this check via the policy).
     */
    public function isBookable(): bool
    {
        if ($this->{PlanInterface::ATTR_ARCHIVED_AT} !== null) {
            return false;
        }

        if ($this->{PlanInterface::ATTR_IS_DEPRECATED} === true) {
            return false;
        }

        return true;
    }
}
