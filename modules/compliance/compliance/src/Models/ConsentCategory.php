<?php

declare(strict_types=1);

namespace Academorix\Compliance\Models;

use Academorix\Compliance\Contracts\Data\ConsentCategoryInterface;
use Academorix\Compliance\Database\Factories\ConsentCategoryFactory;
use Academorix\Compliance\Observers\ConsentCategoryObserver;
use Academorix\Compliance\Policies\ConsentCategoryPolicy;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see ConsentCategoryInterface}.
 *
 * Platform-default rows carry `tenant_id=NULL`; tenant overrides
 * carry a tenant_id. Global scope resolution merges the two sets.
 * NO BelongsToTenant — the model queries across the null-tenant
 * platform bucket + the caller's own tenant.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: ConsentCategoryInterface::TABLE,
    key: ConsentCategoryInterface::PRIMARY_KEY,
    keyType: ConsentCategoryInterface::KEY_TYPE,
)]
#[Fillable([
    ConsentCategoryInterface::ATTR_TENANT_ID,
    ConsentCategoryInterface::ATTR_KEY,
    ConsentCategoryInterface::ATTR_LABEL,
    ConsentCategoryInterface::ATTR_DESCRIPTION,
    ConsentCategoryInterface::ATTR_REQUIRES_GUARDIAN,
    ConsentCategoryInterface::ATTR_IS_SYSTEM,
    ConsentCategoryInterface::ATTR_IS_WITHDRAWABLE,
    ConsentCategoryInterface::ATTR_METADATA,
])]
#[UseFactory(ConsentCategoryFactory::class)]
#[UsePolicy(ConsentCategoryPolicy::class)]
#[ObservedBy([ConsentCategoryObserver::class])]
#[WithoutIncrementing]
final class ConsentCategory extends Model implements AuditableContract, ConsentCategoryInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — booleans coerced on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        ConsentCategoryInterface::ATTR_REQUIRES_GUARDIAN => 'boolean',
        ConsentCategoryInterface::ATTR_IS_SYSTEM         => 'boolean',
        ConsentCategoryInterface::ATTR_IS_WITHDRAWABLE   => 'boolean',
    ];

    /**
     * Records referencing this category.
     *
     * @return HasMany<ConsentRecord, $this>
     */
    public function records(): HasMany
    {
        return $this->hasMany(
            ConsentRecord::class,
            \Academorix\Compliance\Contracts\Data\ConsentRecordInterface::ATTR_CONSENT_CATEGORY_ID,
        );
    }
}
