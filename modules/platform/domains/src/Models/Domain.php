<?php

declare(strict_types=1);

namespace Academorix\Domains\Models;

use Academorix\Application\Concerns\BelongsToApplication;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Domains\Contracts\Data\DomainInterface;
use Academorix\Domains\Database\Factories\DomainFactory;
use Academorix\Domains\Enums\DomainKind;
use Academorix\Domains\Enums\DomainVerificationMethod;
use Academorix\Domains\Enums\SslStatus;
use Academorix\Domains\Observers\DomainObserver;
use Academorix\Domains\Policies\DomainPolicy;
use Academorix\Retention\Attributes\AsRetentionPolicy;
use Academorix\Retention\Enums\RetentionAction;
use Academorix\Tenancy\Concerns\BelongsToTenant;
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
 * Eloquent model for a {@see DomainInterface}.
 *
 * Custom hostname per Tenant. Composes `BelongsToApplication`
 * (application-scoped host lookup) + `BelongsToTenant` (tenant scope
 * on reads).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[Table(
    name: DomainInterface::TABLE,
    key: DomainInterface::PRIMARY_KEY,
    keyType: DomainInterface::KEY_TYPE,
)]
#[Fillable([
    DomainInterface::ATTR_APPLICATION_ID,
    DomainInterface::ATTR_TENANT_ID,
    DomainInterface::ATTR_HOST,
    DomainInterface::ATTR_KIND,
    DomainInterface::ATTR_IS_PRIMARY,
    DomainInterface::ATTR_VERIFIED_AT,
    DomainInterface::ATTR_VERIFICATION_TOKEN,
    DomainInterface::ATTR_VERIFICATION_METHOD,
    DomainInterface::ATTR_VERIFICATION_ATTEMPTS,
    DomainInterface::ATTR_VERIFICATION_LAST_ERROR,
    DomainInterface::ATTR_SSL_STATUS,
    DomainInterface::ATTR_SSL_ISSUED_AT,
    DomainInterface::ATTR_SSL_EXPIRES_AT,
    DomainInterface::ATTR_METADATA,
])]
#[UseFactory(DomainFactory::class)]
#[UsePolicy(DomainPolicy::class)]
#[ObservedBy([DomainObserver::class])]
#[WithoutIncrementing]
#[AsRetentionPolicy(
    key: 'domains.domain',
    label: 'Archived Domains',
    description: 'Hard-delete `domains` rows soft-deleted more than 7 days ago. DNS operators can rollback a delete within a week.',
    retentionDays: 7,
    action: RetentionAction::HardDelete,
)]
final class Domain extends Model implements AuditableContract, DomainInterface
{
    use Auditable;
    use BelongsToApplication;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + datetimes coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        DomainInterface::ATTR_KIND                  => DomainKind::class,
        DomainInterface::ATTR_VERIFICATION_METHOD   => DomainVerificationMethod::class,
        DomainInterface::ATTR_SSL_STATUS            => SslStatus::class,
        DomainInterface::ATTR_IS_PRIMARY            => 'boolean',
        DomainInterface::ATTR_VERIFICATION_ATTEMPTS => 'integer',
        DomainInterface::ATTR_METADATA              => 'array',
        DomainInterface::ATTR_VERIFIED_AT           => 'datetime',
        DomainInterface::ATTR_SSL_ISSUED_AT         => 'datetime',
        DomainInterface::ATTR_SSL_EXPIRES_AT        => 'datetime',
    ];

    /**
     * Expected DNS records for this domain.
     *
     * @return HasMany<DomainRecord, $this>
     */
    public function records(): HasMany
    {
        return $this->hasMany(DomainRecord::class, DomainInterface::ATTR_ID === 'id' ? 'domain_id' : 'domain_id');
    }

    /**
     * Whether this domain is verified (`verified_at IS NOT NULL`).
     */
    public function isVerified(): bool
    {
        return $this->{DomainInterface::ATTR_VERIFIED_AT} !== null;
    }

    /**
     * Whether this is the tenant's primary domain.
     */
    public function isPrimary(): bool
    {
        return (bool) $this->{DomainInterface::ATTR_IS_PRIMARY};
    }

    /**
     * Computed accessor — `https://{host}` when verified + SSL issued.
     */
    public function getPublicUrlAttribute(): ?string
    {
        if (! $this->isVerified()) {
            return null;
        }

        return 'https://' . $this->{DomainInterface::ATTR_HOST};
    }
}
