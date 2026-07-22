<?php

declare(strict_types=1);

namespace Stackra\Notifications\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Database\Factories\NotificationTemplateFactory;
use Stackra\Notifications\Enums\NotificationChannel;
use Stackra\Notifications\Enums\TemplateState;
use Stackra\Notifications\Observers\NotificationTemplateObserver;
use Stackra\Notifications\Policies\NotificationTemplatePolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see NotificationTemplateInterface}.
 *
 * Versioned reusable template — one row per (key, channel, locale,
 * version). Platform defaults carry `is_system=true`; tenant
 * overrides live as same-key, same-channel, same-locale rows with
 * the tenant's id set.
 *
 * `body_rendered_html` carries pre-rendered HTML with Blade
 * placeholders produced by the emails renderer at CI build time.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Table(
    name: NotificationTemplateInterface::TABLE,
    key: NotificationTemplateInterface::PRIMARY_KEY,
    keyType: NotificationTemplateInterface::KEY_TYPE,
)]
#[Fillable([
    NotificationTemplateInterface::ATTR_TENANT_ID,
    NotificationTemplateInterface::ATTR_KEY,
    NotificationTemplateInterface::ATTR_CATEGORY_SLUG,
    NotificationTemplateInterface::ATTR_CHANNEL,
    NotificationTemplateInterface::ATTR_LOCALE,
    NotificationTemplateInterface::ATTR_VERSION,
    NotificationTemplateInterface::ATTR_STATE,
    NotificationTemplateInterface::ATTR_IS_SYSTEM,
    NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE,
    NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML,
    NotificationTemplateInterface::ATTR_PROVIDER_TEMPLATE_ID,
    NotificationTemplateInterface::ATTR_PUBLISHED_AT,
    NotificationTemplateInterface::ATTR_METADATA,
])]
#[UseFactory(NotificationTemplateFactory::class)]
#[UsePolicy(NotificationTemplatePolicy::class)]
#[ObservedBy([NotificationTemplateObserver::class])]
#[WithoutIncrementing]
final class NotificationTemplate extends Model implements AuditableContract, NotificationTemplateInterface
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
     * Cast map — enums + datetimes + booleans.
     *
     * @var array<string, string>
     */
    protected $casts = [
        NotificationTemplateInterface::ATTR_CHANNEL      => NotificationChannel::class,
        NotificationTemplateInterface::ATTR_STATE        => TemplateState::class,
        NotificationTemplateInterface::ATTR_IS_SYSTEM    => 'boolean',
        NotificationTemplateInterface::ATTR_VERSION      => 'integer',
        NotificationTemplateInterface::ATTR_PUBLISHED_AT => 'datetime',
        NotificationTemplateInterface::ATTR_METADATA     => 'array',
    ];
}
