<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Models;

use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Data\EntitlementUsageInterface;
use Stackra\Entitlements\Database\Factories\EntitlementUsageFactory;
use Stackra\Entitlements\Observers\EntitlementUsageObserver;
use Stackra\Entitlements\Policies\EntitlementUsagePolicy;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for an {@see EntitlementUsageInterface}.
 *
 * Append-only per-consumption audit row. NO soft deletes — retention
 * is handled by the retention job (per entitlement's declared
 * retention window). The `key` column is denormalised from the parent
 * `Entitlement` for hot-path queries.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Table(
    name: EntitlementUsageInterface::TABLE,
    key: EntitlementUsageInterface::PRIMARY_KEY,
    keyType: EntitlementUsageInterface::KEY_TYPE,
)]
#[Fillable([
    EntitlementUsageInterface::ATTR_TENANT_ID,
    EntitlementUsageInterface::ATTR_ENTITLEMENT_ID,
    EntitlementUsageInterface::ATTR_KEY,
    EntitlementUsageInterface::ATTR_DELTA,
    EntitlementUsageInterface::ATTR_REASON,
    EntitlementUsageInterface::ATTR_ACTOR_TYPE,
    EntitlementUsageInterface::ATTR_ACTOR_ID,
    EntitlementUsageInterface::ATTR_CORRELATION_ID,
    EntitlementUsageInterface::ATTR_CURRENT_PERIOD_KEY,
    EntitlementUsageInterface::ATTR_METADATA,
])]
#[UseFactory(EntitlementUsageFactory::class)]
#[UsePolicy(EntitlementUsagePolicy::class)]
#[ObservedBy([EntitlementUsageObserver::class])]
#[WithoutIncrementing]
final class EntitlementUsage extends Model implements AuditableContract, EntitlementUsageInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use Userstamps;

    /**
     * Cast map — integer coercion on the hot `delta` counter.
     *
     * @var array<string, string>
     */
    protected $casts = [
        EntitlementUsageInterface::ATTR_DELTA => 'integer',
    ];

    /**
     * Parent entitlement row.
     *
     * @return BelongsTo<Entitlement, $this>
     */
    public function entitlement(): BelongsTo
    {
        return $this->belongsTo(
            Entitlement::class,
            EntitlementUsageInterface::ATTR_ENTITLEMENT_ID,
            EntitlementInterface::ATTR_ID,
        );
    }
}
