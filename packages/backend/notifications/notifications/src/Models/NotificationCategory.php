<?php

declare(strict_types=1);

namespace Stackra\Notifications\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Notifications\Contracts\Data\NotificationCategoryInterface;
use Stackra\Notifications\Database\Factories\NotificationCategoryFactory;
use Stackra\Notifications\Enums\ConsentTier;
use Stackra\Notifications\Enums\NotificationPriority;
use Stackra\Notifications\Observers\NotificationCategoryObserver;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NotificationCategoryInterface}.
 *
 * Module-fed category registry. `tenant_id` is nullable — NULL rows
 * are platform defaults; a tenant-specific row (same slug, tenant_id
 * set) overrides the platform default for that tenant.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationCategoryInterface::TABLE,
    key: NotificationCategoryInterface::PRIMARY_KEY,
    keyType: NotificationCategoryInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationCategoryInterface::ATTR_TENANT_ID,
    NotificationCategoryInterface::ATTR_SLUG,
    NotificationCategoryInterface::ATTR_DISPLAY_NAME,
    NotificationCategoryInterface::ATTR_DESCRIPTION,
    NotificationCategoryInterface::ATTR_OWNING_MODULE,
    NotificationCategoryInterface::ATTR_DEFAULT_CHANNELS,
    NotificationCategoryInterface::ATTR_PRIORITY,
    NotificationCategoryInterface::ATTR_CONSENT_TIER,
    NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED,
    NotificationCategoryInterface::ATTR_IS_SYSTEM,
    NotificationCategoryInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationCategoryFactory::class)]
#[ObservedBy([NotificationCategoryObserver::class])]
#[WithoutIncrementing]
final class NotificationCategory extends Model implements AuditableContract, NotificationCategoryInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + JSON arrays.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationCategoryInterface::ATTR_PRIORITY         => NotificationPriority::class,
        NotificationCategoryInterface::ATTR_CONSENT_TIER     => ConsentTier::class,
        NotificationCategoryInterface::ATTR_DEFAULT_CHANNELS => 'array',
        NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED  => 'boolean',
        NotificationCategoryInterface::ATTR_IS_SYSTEM        => 'boolean',
        NotificationCategoryInterface::ATTR_METADATA         => 'array',
    ];
}
