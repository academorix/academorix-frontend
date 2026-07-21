<?php

declare(strict_types=1);

namespace Stackra\Application\Models;

use Stackra\Application\Contracts\Data\ApplicationInterface;
use Stackra\Application\Database\Factories\ApplicationFactory;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Observers\ApplicationObserver;
use Stackra\Application\Policies\ApplicationPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Retention\Attributes\AsRetentionPolicy;
use Stackra\Retention\Enums\RetentionAction;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for an {@see ApplicationInterface}.
 *
 * Global cross-tenant product registry — one row per Stackra
 * deployment. Applications rarely change (~1-8 rows lifetime).
 * Composes `HasSystemFlag` — the observer refuses mutations on
 * `is_system = true` rows outside a sanctioned mutation scope.
 * Composes NO `BelongsToTenant` — Application sits ABOVE the tenancy
 * boundary; it's the row Tenants FK into.
 */
#[Table(
    name: ApplicationInterface::TABLE,
    key: ApplicationInterface::PRIMARY_KEY,
    keyType: ApplicationInterface::KEY_TYPE,
)]
#[Fillable([
    ApplicationInterface::ATTR_SLUG,
    ApplicationInterface::ATTR_NAME,
    ApplicationInterface::ATTR_DESCRIPTION,
    ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE,
    ApplicationInterface::ATTR_DEFAULT_LOCALE,
    ApplicationInterface::ATTR_DEFAULT_TIMEZONE,
    ApplicationInterface::ATTR_DEFAULT_CURRENCY,
    ApplicationInterface::ATTR_CENTRAL_HOST,
    ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST,
    ApplicationInterface::ATTR_CONFIG,
    ApplicationInterface::ATTR_METADATA,
    ApplicationInterface::ATTR_IS_DEFAULT,
    ApplicationInterface::ATTR_IS_SYSTEM,
])]
#[UseFactory(ApplicationFactory::class)]
#[UsePolicy(ApplicationPolicy::class)]
#[ObservedBy([ApplicationObserver::class])]
#[WithoutIncrementing]
#[AsRetentionPolicy(
    key: 'application.application',
    label: 'Applications',
    description: 'Archive `applications` rows older than 730 days that were soft-deleted — Application rows carry cross-service references (JWT `app` claim, host resolution) worth 2 years of forensic value.',
    retentionDays: 730,
    action: RetentionAction::Archive,
)]
final class Application extends Model implements ApplicationInterface, AuditableContract
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + booleans coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE => BusinessTypeEnum::class,
        ApplicationInterface::ATTR_CONFIG                => 'array',
        ApplicationInterface::ATTR_METADATA              => 'array',
        ApplicationInterface::ATTR_IS_DEFAULT            => 'boolean',
        ApplicationInterface::ATTR_IS_SYSTEM             => 'boolean',
    ];

    /**
     * Computed accessor — the marketing / tenant-picker URL for
     * this Application. Composed as `https://{central_host}`.
     */
    public function getCentralUrlAttribute(): string
    {
        return 'https://'.$this->{ApplicationInterface::ATTR_CENTRAL_HOST};
    }

    /**
     * Computed accessor — the Stackra staff surface URL.
     */
    public function getPlatformAdminUrlAttribute(): string
    {
        return 'https://'.$this->{ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST};
    }
}
