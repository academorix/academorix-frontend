<?php

declare(strict_types=1);

namespace Stackra\Notifications\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Database\Factories\NotificationFactory;
use Stackra\Notifications\Enums\NotificationPriority;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Observers\NotificationObserver;
use Stackra\Notifications\Policies\NotificationPolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
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
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NotificationInterface}.
 *
 * The universal delivery record — one row per (recipient, category,
 * template, dispatch). Every child `NotificationDelivery` (one per
 * channel attempt) belongs to a `Notification`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationInterface::TABLE,
    key: NotificationInterface::PRIMARY_KEY,
    keyType: NotificationInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationInterface::ATTR_TENANT_ID,
    NotificationInterface::ATTR_APPLICATION_ID,
    NotificationInterface::ATTR_TEMPLATE_ID,
    NotificationInterface::ATTR_CATEGORY_SLUG,
    NotificationInterface::ATTR_TEMPLATE_KEY,
    NotificationInterface::ATTR_PRIORITY,
    NotificationInterface::ATTR_STATE,
    NotificationInterface::ATTR_ADDRESSEE_TYPE,
    NotificationInterface::ATTR_ADDRESSEE_ID,
    NotificationInterface::ATTR_ADDRESSEE_EMAIL,
    NotificationInterface::ATTR_ADDRESSEE_PHONE,
    NotificationInterface::ATTR_ADDRESSEE_NAME,
    NotificationInterface::ATTR_ADDRESSEE_LOCALE,
    NotificationInterface::ATTR_ADDRESSEE_TIMEZONE,
    NotificationInterface::ATTR_ADDRESSEE_CONSENT_GATE,
    NotificationInterface::ATTR_ACTOR_TYPE,
    NotificationInterface::ATTR_ACTOR_ID,
    NotificationInterface::ATTR_SUBJECT,
    NotificationInterface::ATTR_PAYLOAD,
    NotificationInterface::ATTR_PRIORITY_CHANNELS,
    NotificationInterface::ATTR_SEEN_AT,
    NotificationInterface::ATTR_ARCHIVED_AT,
    NotificationInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationFactory::class)]
#[UsePolicy(NotificationPolicy::class)]
#[ObservedBy([NotificationObserver::class])]
#[WithoutIncrementing]
final class Notification extends Model implements AuditableContract, NotificationInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON payload + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationInterface::ATTR_PRIORITY          => NotificationPriority::class,
        NotificationInterface::ATTR_STATE             => NotificationStatus::class,
        NotificationInterface::ATTR_PAYLOAD           => 'array',
        NotificationInterface::ATTR_PRIORITY_CHANNELS => 'array',
        NotificationInterface::ATTR_METADATA          => 'array',
        NotificationInterface::ATTR_SEEN_AT           => 'datetime',
        NotificationInterface::ATTR_ARCHIVED_AT       => 'datetime',
    ];

    /**
     * Per-channel delivery attempts for this notification.
     *
     * @return HasMany<NotificationDelivery, $this>
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(NotificationDelivery::class, NotificationDeliveryInterface::ATTR_NOTIFICATION_ID);
    }
}
