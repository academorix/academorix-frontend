<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Models;

use Stackra\Application\Concerns\BelongsToApplication;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Database\Concerns\HasSystemFlag;
use Stackra\Retention\Attributes\AsRetentionPolicy;
use Stackra\Retention\Enums\RetentionAction;
use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Database\Factories\TenantFactory;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Observers\TenantObserver;
use Stackra\Tenancy\Policies\TenantPolicy;
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
 * Eloquent model for a {@see TenantInterface}.
 *
 * Customer of an Stackra Application — one of the eight rows that
 * carry `application_id` directly (per `.kiro/steering/
 * tenancy-columns.md` §2). Sits ABOVE the tenancy boundary itself
 * (no `BelongsToTenant`), because it IS the row every tenant-scoped
 * row FKs to.
 *
 * Composes `HasSystemFlag` — the observer refuses mutations on
 * `is_system = true` rows outside sanctioned scopes (e.g. Stackra's
 * own demo/support tenants).
 */
#[Table(
    name: TenantInterface::TABLE,
    key: TenantInterface::PRIMARY_KEY,
    keyType: TenantInterface::KEY_TYPE,
)]
#[Fillable([
    TenantInterface::ATTR_APPLICATION_ID,
    TenantInterface::ATTR_SLUG,
    TenantInterface::ATTR_NAME,
    TenantInterface::ATTR_LEGAL_NAME,
    TenantInterface::ATTR_STATUS,
    TenantInterface::ATTR_BUSINESS_TYPE,
    TenantInterface::ATTR_LOCALE,
    TenantInterface::ATTR_TIMEZONE,
    TenantInterface::ATTR_CURRENCY,
    TenantInterface::ATTR_COUNTRY_CODE,
    TenantInterface::ATTR_TAX_ID,
    TenantInterface::ATTR_PRIMARY_BRANDING_ID,
    TenantInterface::ATTR_BRANDING,
    TenantInterface::ATTR_SETTINGS,
    TenantInterface::ATTR_FEATURES,
    TenantInterface::ATTR_TERMINOLOGY,
    TenantInterface::ATTR_TRIAL_ENDS_AT,
    TenantInterface::ATTR_SUSPENDED_AT,
    TenantInterface::ATTR_SUSPENSION_REASON,
    TenantInterface::ATTR_GRACE_ENDS_AT,
    TenantInterface::ATTR_ARCHIVED_AT,
    TenantInterface::ATTR_METADATA,
    TenantInterface::ATTR_IS_SYSTEM,
])]
#[UseFactory(TenantFactory::class)]
#[UsePolicy(TenantPolicy::class)]
#[ObservedBy([TenantObserver::class])]
#[WithoutIncrementing]
#[AsRetentionPolicy(
    key: 'tenancy.tenant',
    label: 'Archived Tenants',
    description: 'Hard-delete `tenants` rows soft-deleted more than 30 days ago. Cascade fires the TenantErased event so downstream modules can anonymise their tenant-scoped rows first.',
    retentionDays: 30,
    action: RetentionAction::HardDelete,
)]
final class Tenant extends Model implements AuditableContract, TenantInterface
{
    use Auditable;
    use BelongsToApplication;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + datetime coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TenantInterface::ATTR_STATUS         => TenantStatus::class,
        TenantInterface::ATTR_BUSINESS_TYPE  => BusinessTypeEnum::class,
        TenantInterface::ATTR_BRANDING       => 'array',
        TenantInterface::ATTR_SETTINGS       => 'array',
        TenantInterface::ATTR_FEATURES       => 'array',
        TenantInterface::ATTR_TERMINOLOGY    => 'array',
        TenantInterface::ATTR_METADATA       => 'array',
        TenantInterface::ATTR_IS_SYSTEM      => 'boolean',
        TenantInterface::ATTR_TRIAL_ENDS_AT  => 'datetime',
        TenantInterface::ATTR_SUSPENDED_AT   => 'datetime',
        TenantInterface::ATTR_GRACE_ENDS_AT  => 'datetime',
        TenantInterface::ATTR_ARCHIVED_AT    => 'datetime',
    ];

    /**
     * Named contacts on this tenant.
     *
     * @return HasMany<TenantContact, $this>
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(TenantContact::class);
    }

    /**
     * Whether the tenant is in trial (`status = trialing` + trial not expired).
     */
    public function isTrialing(): bool
    {
        return $this->{TenantInterface::ATTR_STATUS} === TenantStatus::Trialing;
    }

    /**
     * Whether the tenant is currently suspended.
     */
    public function isSuspended(): bool
    {
        return $this->{TenantInterface::ATTR_STATUS} === TenantStatus::Suspended;
    }

    /**
     * Whether the tenant is archived (awaiting hard-delete).
     */
    public function isArchived(): bool
    {
        return $this->{TenantInterface::ATTR_STATUS} === TenantStatus::Archived;
    }
}
