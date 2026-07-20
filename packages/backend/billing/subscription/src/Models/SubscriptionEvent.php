<?php

declare(strict_types=1);

namespace Academorix\Subscription\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Database\Factories\SubscriptionEventFactory;
use Academorix\Subscription\Enums\SubscriptionEventActor;
use Academorix\Subscription\Enums\SubscriptionEventKind;
use Academorix\Subscription\Observers\SubscriptionEventObserver;
use Academorix\Subscription\Policies\SubscriptionEventPolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Eloquent model for a {@see SubscriptionEventInterface}.
 *
 * Append-only audit row for every Subscription state change.
 * Retained 7 years for SOX 404 revenue-recognition evidence.
 *
 * ## Notes
 *
 *  * NO SoftDeletes — the event feed is truly append-only. Consumer
 *    UIs surface events as immutable rows; retention policy handles
 *    the eventual purge.
 *  * NO HasUserstamps — the row carries `actor_id` explicitly for
 *    audit purposes. Duplicating that in `created_by` would just
 *    drift.
 *  * NO HasAudit — the event IS the audit trail; adding
 *    owen-it/laravel-auditing on top would double-log.
 *  * Idempotency is enforced by a unique partial index on
 *    `provider_event_id` — the Cashier webhook consumer refuses to
 *    re-process an event it has already recorded.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Table(
    name: SubscriptionEventInterface::TABLE,
    key: SubscriptionEventInterface::PRIMARY_KEY,
    keyType: SubscriptionEventInterface::KEY_TYPE,
)]
#[Fillable([
    SubscriptionEventInterface::ATTR_TENANT_ID,
    SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID,
    SubscriptionEventInterface::ATTR_KIND,
    SubscriptionEventInterface::ATTR_FROM_STATE,
    SubscriptionEventInterface::ATTR_TO_STATE,
    SubscriptionEventInterface::ATTR_FROM_PLAN_ID,
    SubscriptionEventInterface::ATTR_TO_PLAN_ID,
    SubscriptionEventInterface::ATTR_AMOUNT_MICRO_UNITS,
    SubscriptionEventInterface::ATTR_CURRENCY,
    SubscriptionEventInterface::ATTR_OCCURRED_AT,
    SubscriptionEventInterface::ATTR_ACTOR_TYPE,
    SubscriptionEventInterface::ATTR_ACTOR_ID,
    SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID,
    SubscriptionEventInterface::ATTR_REASON,
    SubscriptionEventInterface::ATTR_PAYLOAD,
    SubscriptionEventInterface::ATTR_METADATA,
])]
#[UseFactory(SubscriptionEventFactory::class)]
#[UsePolicy(SubscriptionEventPolicy::class)]
#[ObservedBy([SubscriptionEventObserver::class])]
#[WithoutIncrementing]
final class SubscriptionEvent extends Model implements SubscriptionEventInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;

    /**
     * Cast map — enums + JSON + datetime + integer coerced on
     * hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SubscriptionEventInterface::ATTR_KIND               => SubscriptionEventKind::class,
        SubscriptionEventInterface::ATTR_ACTOR_TYPE         => SubscriptionEventActor::class,
        SubscriptionEventInterface::ATTR_OCCURRED_AT        => 'datetime',
        SubscriptionEventInterface::ATTR_AMOUNT_MICRO_UNITS => 'integer',
        SubscriptionEventInterface::ATTR_PAYLOAD            => 'array',
    ];

    /**
     * The parent subscription this event belongs to.
     *
     * @return BelongsTo<Subscription, $this>
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(
            Subscription::class,
            SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID,
        );
    }
}
