<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Database\Factories\FeatureKillSwitchFactory;
use Academorix\FeatureFlags\Observers\FeatureKillSwitchObserver;
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
 * Eloquent model for a {@see FeatureKillSwitch} row.
 *
 * Platform-scoped emergency shut-off row consumed by the
 * resolver's `KillSwitchLayer`. Deliberately does NOT compose
 * `BelongsToTenant` — tenant targeting is encoded via
 * `(scope_level = 'tenant', scope_value = <tenant id>)`. A NULL
 * `scope_value` means "every value at this level" (Requirement 9.7).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Table(
    name: FeatureKillSwitchInterface::TABLE,
    key: FeatureKillSwitchInterface::PRIMARY_KEY,
    keyType: FeatureKillSwitchInterface::KEY_TYPE,
)]
#[Fillable([
    FeatureKillSwitchInterface::ATTR_FLAG,
    FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL,
    FeatureKillSwitchInterface::ATTR_SCOPE_VALUE,
    FeatureKillSwitchInterface::ATTR_REASON,
    FeatureKillSwitchInterface::ATTR_ENABLED_AT,
    FeatureKillSwitchInterface::ATTR_DISABLED_AT,
])]
#[UseFactory(FeatureKillSwitchFactory::class)]
#[ObservedBy([FeatureKillSwitchObserver::class])]
#[WithoutIncrementing]
final class FeatureKillSwitch extends Model implements AuditableContract, FeatureKillSwitchInterface
{
    use Auditable;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * ULID prefix applied by `HasPrefixedUlid` at `creating`.
     *
     * @var string
     */
    public const string ID_PREFIX = 'fk';

    /**
     * Cast map — datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FeatureKillSwitchInterface::ATTR_ENABLED_AT  => 'datetime',
        FeatureKillSwitchInterface::ATTR_DISABLED_AT => 'datetime',
    ];
}
