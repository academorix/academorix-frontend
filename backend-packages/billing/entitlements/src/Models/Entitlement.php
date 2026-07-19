<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Models;

use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Entitlements\Casts\EntitlementValue;
use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Database\Factories\EntitlementFactory;
use Academorix\Entitlements\Enums\EntitlementKind;
use Academorix\Entitlements\Enums\EntitlementPeriod;
use Academorix\Entitlements\Enums\EntitlementSource;
use Academorix\Entitlements\Observers\EntitlementObserver;
use Academorix\Entitlements\Policies\EntitlementPolicy;
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
 * Eloquent model for an {@see EntitlementInterface}.
 *
 * One row per `(tenant_id, key)` tuple. Composes `BelongsToTenant`
 * so every read/write auto-scopes to the active tenant. Period
 * columns are populated only for pool-kind rows.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Table(
    name: EntitlementInterface::TABLE,
    key: EntitlementInterface::PRIMARY_KEY,
    keyType: EntitlementInterface::KEY_TYPE,
)]
#[Fillable([
    EntitlementInterface::ATTR_TENANT_ID,
    EntitlementInterface::ATTR_KEY,
    EntitlementInterface::ATTR_KIND,
    EntitlementInterface::ATTR_VALUE,
    EntitlementInterface::ATTR_PERIOD,
    EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT,
    EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT,
    EntitlementInterface::ATTR_SOURCE,
    EntitlementInterface::ATTR_PLAN_ID,
    EntitlementInterface::ATTR_NOTES,
    EntitlementInterface::ATTR_METADATA,
])]
#[UseFactory(EntitlementFactory::class)]
#[UsePolicy(EntitlementPolicy::class)]
#[ObservedBy([EntitlementObserver::class])]
#[WithoutIncrementing]
final class Entitlement extends Model implements AuditableContract, EntitlementInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + schema-aware JSON + datetime coercion on
     * hydrate. `value` uses {@see EntitlementValue} so the shape is
     * normalised against the declared kind on every write.
     *
     * @var array<string, string>
     */
    protected $casts = [
        EntitlementInterface::ATTR_KIND                     => EntitlementKind::class,
        EntitlementInterface::ATTR_VALUE                    => EntitlementValue::class,
        EntitlementInterface::ATTR_PERIOD                   => EntitlementPeriod::class,
        EntitlementInterface::ATTR_SOURCE                   => EntitlementSource::class,
        EntitlementInterface::ATTR_CURRENT_PERIOD_STARTS_AT => 'datetime',
        EntitlementInterface::ATTR_CURRENT_PERIOD_ENDS_AT   => 'datetime',
    ];

    /**
     * Audit rows for this entitlement.
     *
     * @return HasMany<EntitlementUsage, $this>
     */
    public function usages(): HasMany
    {
        return $this->hasMany(
            EntitlementUsage::class,
            \Academorix\Entitlements\Contracts\Data\EntitlementUsageInterface::ATTR_ENTITLEMENT_ID,
        );
    }

    /**
     * Whether the caller can consume `$amount` of this entitlement.
     *
     * Slot + pool: `used + amount <= limit`. Boolean: `enabled === true`.
     * Unlimited: always true.
     */
    public function canConsume(int $amount = 1): bool
    {
        $kind = $this->{EntitlementInterface::ATTR_KIND};

        if ($kind === EntitlementKind::Unlimited || $kind === EntitlementKind::Unlimited->value) {
            return true;
        }

        /** @var array<string, mixed> $value */
        $value = $this->{EntitlementInterface::ATTR_VALUE} ?? [];

        if ($kind === EntitlementKind::Boolean || $kind === EntitlementKind::Boolean->value) {
            return (bool) ($value['enabled'] ?? false);
        }

        $limit = (int) ($value['limit'] ?? 0);
        $used  = (int) ($value['used'] ?? 0);

        return ($used + $amount) <= $limit;
    }

    /**
     * Current usage as a fraction of the cap (0.0 - 1.0). Returns
     * 0.0 for unlimited + boolean; the ratio for slot + pool.
     */
    public function usageRatio(): float
    {
        $kind = $this->{EntitlementInterface::ATTR_KIND};
        if (
            $kind === EntitlementKind::Unlimited
            || $kind === EntitlementKind::Unlimited->value
            || $kind === EntitlementKind::Boolean
            || $kind === EntitlementKind::Boolean->value
        ) {
            return 0.0;
        }

        /** @var array<string, mixed> $value */
        $value = $this->{EntitlementInterface::ATTR_VALUE} ?? [];
        $limit = (int) ($value['limit'] ?? 0);
        if ($limit <= 0) {
            return 0.0;
        }

        return \min(1.0, ((int) ($value['used'] ?? 0)) / $limit);
    }
}
