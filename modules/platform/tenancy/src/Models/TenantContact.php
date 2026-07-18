<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Tenancy\Concerns\BelongsToTenant;
use Academorix\Tenancy\Contracts\Data\TenantContactInterface;
use Academorix\Tenancy\Database\Factories\TenantContactFactory;
use Academorix\Tenancy\Enums\TenantContactKind;
use Academorix\Tenancy\Observers\TenantContactObserver;
use Academorix\Tenancy\Policies\TenantContactPolicy;
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
 * Eloquent model for a {@see TenantContactInterface}.
 *
 * Named contact per tenant, per role. GDPR Art. 30 ROPA requires the
 * DPO contact to be legally distinct from other roles; separate rows
 * per {@see TenantContactKind} keep them addressable independently.
 */
#[Table(
    name: TenantContactInterface::TABLE,
    key: TenantContactInterface::PRIMARY_KEY,
    keyType: TenantContactInterface::KEY_TYPE,
)]
#[Fillable([
    TenantContactInterface::ATTR_TENANT_ID,
    TenantContactInterface::ATTR_KIND,
    TenantContactInterface::ATTR_NAME,
    TenantContactInterface::ATTR_EMAIL,
    TenantContactInterface::ATTR_PHONE,
    TenantContactInterface::ATTR_JOB_TITLE,
    TenantContactInterface::ATTR_ADDRESS,
    TenantContactInterface::ATTR_NOTES,
    TenantContactInterface::ATTR_IS_PRIMARY,
    TenantContactInterface::ATTR_VERIFIED_AT,
    TenantContactInterface::ATTR_METADATA,
])]
#[UseFactory(TenantContactFactory::class)]
#[UsePolicy(TenantContactPolicy::class)]
#[ObservedBy([TenantContactObserver::class])]
#[WithoutIncrementing]
final class TenantContact extends Model implements AuditableContract, TenantContactInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + JSON + booleans + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        TenantContactInterface::ATTR_KIND        => TenantContactKind::class,
        TenantContactInterface::ATTR_ADDRESS     => 'array',
        TenantContactInterface::ATTR_METADATA    => 'array',
        TenantContactInterface::ATTR_IS_PRIMARY  => 'boolean',
        TenantContactInterface::ATTR_VERIFIED_AT => 'datetime',
    ];

    /**
     * Whether this contact has been verified (email confirmation).
     */
    public function isVerified(): bool
    {
        return $this->{TenantContactInterface::ATTR_VERIFIED_AT} !== null;
    }

    /**
     * Whether this is the primary contact of its kind for the tenant.
     */
    public function isPrimary(): bool
    {
        return (bool) $this->{TenantContactInterface::ATTR_IS_PRIMARY};
    }
}
