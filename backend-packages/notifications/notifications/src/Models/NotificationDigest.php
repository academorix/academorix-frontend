<?php

declare(strict_types=1);

namespace Academorix\Notifications\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Notifications\Contracts\Data\NotificationDigestInterface;
use Academorix\Notifications\Database\Factories\NotificationDigestFactory;
use Academorix\Notifications\Enums\DigestState;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Mattiverse\Userstamps\Traits\Userstamps;

/**
 * Eloquent model for a {@see NotificationDigestInterface}.
 *
 * Batched digest of pending notifications (daily / weekly). Not
 * audited — transient batching state with 30-day retention +
 * hard-purge.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationDigestInterface::TABLE,
    key: NotificationDigestInterface::PRIMARY_KEY,
    keyType: NotificationDigestInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationDigestInterface::ATTR_TENANT_ID,
    NotificationDigestInterface::ATTR_USER_ID,
    NotificationDigestInterface::ATTR_CATEGORY_SLUG,
    NotificationDigestInterface::ATTR_CHANNEL,
    NotificationDigestInterface::ATTR_STATE,
    NotificationDigestInterface::ATTR_SCHEDULED_FOR,
    NotificationDigestInterface::ATTR_DELIVERED_AT,
    NotificationDigestInterface::ATTR_NOTIFICATION_IDS,
    NotificationDigestInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationDigestFactory::class)]
#[WithoutIncrementing]
final class NotificationDigest extends Model implements NotificationDigestInterface
{
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enums + datetimes + JSON arrays.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationDigestInterface::ATTR_CHANNEL          => NotificationChannel::class,
        NotificationDigestInterface::ATTR_STATE            => DigestState::class,
        NotificationDigestInterface::ATTR_SCHEDULED_FOR    => 'datetime',
        NotificationDigestInterface::ATTR_DELIVERED_AT     => 'datetime',
        NotificationDigestInterface::ATTR_NOTIFICATION_IDS => 'array',
        NotificationDigestInterface::ATTR_METADATA         => 'array',
    ];
}
