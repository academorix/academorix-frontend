<?php

declare(strict_types=1);

namespace Stackra\Notifications\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Notifications\Contracts\Data\NotificationDeliveryInterface;
use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Database\Factories\NotificationDeliveryFactory;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Enums\NotificationStatus;
use Stackra\Notifications\Observers\NotificationDeliveryObserver;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NotificationDeliveryInterface}.
 *
 * Per-channel delivery attempt for a parent Notification. Retries
 * create a new row (incremented `attempt`) so the audit trail
 * captures every send.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationDeliveryInterface::TABLE,
    key: NotificationDeliveryInterface::PRIMARY_KEY,
    keyType: NotificationDeliveryInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationDeliveryInterface::ATTR_TENANT_ID,
    NotificationDeliveryInterface::ATTR_NOTIFICATION_ID,
    NotificationDeliveryInterface::ATTR_CHANNEL,
    NotificationDeliveryInterface::ATTR_PROVIDER,
    NotificationDeliveryInterface::ATTR_PROVIDER_MESSAGE_ID,
    NotificationDeliveryInterface::ATTR_STATE,
    NotificationDeliveryInterface::ATTR_ATTEMPT,
    NotificationDeliveryInterface::ATTR_ATTEMPTED_AT,
    NotificationDeliveryInterface::ATTR_DELIVERED_AT,
    NotificationDeliveryInterface::ATTR_FAILED_AT,
    NotificationDeliveryInterface::ATTR_OPENED_AT,
    NotificationDeliveryInterface::ATTR_OPENED_IP,
    NotificationDeliveryInterface::ATTR_OPENED_USER_AGENT,
    NotificationDeliveryInterface::ATTR_LAST_CLICK_AT,
    NotificationDeliveryInterface::ATTR_ERROR_CODE,
    NotificationDeliveryInterface::ATTR_ERROR_MESSAGE,
    NotificationDeliveryInterface::ATTR_RETRY_COUNT,
    NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT,
    NotificationDeliveryInterface::ATTR_COST_MICRO_UNITS,
    NotificationDeliveryInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationDeliveryFactory::class)]
#[ObservedBy([NotificationDeliveryObserver::class])]
#[WithoutIncrementing]
final class NotificationDelivery extends Model implements AuditableContract, NotificationDeliveryInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + datetimes + integer counters.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationDeliveryInterface::ATTR_CHANNEL          => NotificationChannel::class,
        NotificationDeliveryInterface::ATTR_STATE            => NotificationStatus::class,
        NotificationDeliveryInterface::ATTR_ATTEMPT          => 'integer',
        NotificationDeliveryInterface::ATTR_RETRY_COUNT      => 'integer',
        NotificationDeliveryInterface::ATTR_COST_MICRO_UNITS => 'integer',
        NotificationDeliveryInterface::ATTR_ATTEMPTED_AT     => 'datetime',
        NotificationDeliveryInterface::ATTR_DELIVERED_AT     => 'datetime',
        NotificationDeliveryInterface::ATTR_FAILED_AT        => 'datetime',
        NotificationDeliveryInterface::ATTR_OPENED_AT        => 'datetime',
        NotificationDeliveryInterface::ATTR_LAST_CLICK_AT    => 'datetime',
        NotificationDeliveryInterface::ATTR_NEXT_RETRY_AT    => 'datetime',
        NotificationDeliveryInterface::ATTR_METADATA         => 'array',
    ];

    /**
     * Parent Notification.
     *
     * @return BelongsTo<Notification, $this>
     */
    public function notification(): BelongsTo
    {
        return $this->belongsTo(Notification::class, NotificationDeliveryInterface::ATTR_NOTIFICATION_ID, NotificationInterface::ATTR_ID);
    }
}
