<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Models;

use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Database\Factories\FeatureRolloutFactory;
use Stackra\FeatureFlags\Observers\FeatureRolloutObserver;
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
 * Eloquent model for a {@see FeatureRollout} row.
 *
 * Per-tenant percentage-based enablement row consumed by the
 * resolver's `RolloutLayer`. There is NO `scope_value` column —
 * the caller's concrete `ScopeValue` at `scope_level` is drawn
 * from the active `ScopePath` at evaluation time and fed to
 * `RolloutHasher`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Table(
    name: FeatureRolloutInterface::TABLE,
    key: FeatureRolloutInterface::PRIMARY_KEY,
    keyType: FeatureRolloutInterface::KEY_TYPE,
)]
#[Fillable([
    FeatureRolloutInterface::ATTR_TENANT_ID,
    FeatureRolloutInterface::ATTR_FLAG,
    FeatureRolloutInterface::ATTR_SCOPE_LEVEL,
    FeatureRolloutInterface::ATTR_PERCENTAGE,
    FeatureRolloutInterface::ATTR_NOTES,
    FeatureRolloutInterface::ATTR_STARTS_AT,
    FeatureRolloutInterface::ATTR_ENDS_AT,
])]
#[UseFactory(FeatureRolloutFactory::class)]
#[ObservedBy([FeatureRolloutObserver::class])]
#[WithoutIncrementing]
final class FeatureRollout extends Model implements AuditableContract, FeatureRolloutInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * ULID prefix applied by `HasPrefixedUlid` at `creating`.
     *
     * @var string
     */
    public const string ID_PREFIX = 'fr';

    /**
     * Cast map — int + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FeatureRolloutInterface::ATTR_PERCENTAGE => 'int',
        FeatureRolloutInterface::ATTR_STARTS_AT  => 'datetime',
        FeatureRolloutInterface::ATTR_ENDS_AT    => 'datetime',
    ];
}
