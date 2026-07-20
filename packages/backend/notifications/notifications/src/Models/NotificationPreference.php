<?php

declare(strict_types=1);

namespace Academorix\Notifications\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Academorix\Notifications\Database\Factories\NotificationPreferenceFactory;
use Academorix\Notifications\Enums\DigestMode;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Notifications\Observers\NotificationPreferenceObserver;
use Academorix\Notifications\Policies\NotificationPreferencePolicy;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NotificationPreferenceInterface}.
 *
 * Per-user opt-in per (category, channel) with quiet hours + digest
 * mode. NOT soft-deleted — preferences are hard-deleted on GDPR
 * Art. 17 user erasure. `quiet_hours_*` is an inclusive range in
 * the user's `quiet_hours_timezone`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationPreferenceInterface::TABLE,
    key: NotificationPreferenceInterface::PRIMARY_KEY,
    keyType: NotificationPreferenceInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationPreferenceInterface::ATTR_TENANT_ID,
    NotificationPreferenceInterface::ATTR_USER_ID,
    NotificationPreferenceInterface::ATTR_CATEGORY_SLUG,
    NotificationPreferenceInterface::ATTR_CHANNEL,
    NotificationPreferenceInterface::ATTR_ENABLED,
    NotificationPreferenceInterface::ATTR_DIGEST_MODE,
    NotificationPreferenceInterface::ATTR_QUIET_HOURS_START,
    NotificationPreferenceInterface::ATTR_QUIET_HOURS_END,
    NotificationPreferenceInterface::ATTR_QUIET_HOURS_TIMEZONE,
    NotificationPreferenceInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationPreferenceFactory::class)]
#[UsePolicy(NotificationPreferencePolicy::class)]
#[ObservedBy([NotificationPreferenceObserver::class])]
#[WithoutIncrementing]
final class NotificationPreference extends Model implements AuditableContract, NotificationPreferenceInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — enums + booleans + metadata.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationPreferenceInterface::ATTR_CHANNEL     => NotificationChannel::class,
        NotificationPreferenceInterface::ATTR_DIGEST_MODE => DigestMode::class,
        NotificationPreferenceInterface::ATTR_ENABLED     => 'boolean',
        NotificationPreferenceInterface::ATTR_METADATA    => 'array',
    ];
}
