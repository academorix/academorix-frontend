<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Models;

use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Database\Factories\FeatureOverrideFactory;
use Academorix\FeatureFlags\Enums\OverrideDecision;
use Academorix\FeatureFlags\Observers\FeatureOverrideObserver;
use Academorix\Tenancy\Concerns\BelongsToTenant;
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
 * Eloquent model for a {@see FeatureOverride} row.
 *
 * Per-tenant explicit allow/deny row consumed by the resolver's
 * `OverrideLayer`. Composes `BelongsToTenant` so every read/write
 * is scoped to the active tenant automatically. Deepest-wins
 * precedence is applied at query time using
 * `scope_definitions.sort_order`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Table(
    name: FeatureOverrideInterface::TABLE,
    key: FeatureOverrideInterface::PRIMARY_KEY,
    keyType: FeatureOverrideInterface::KEY_TYPE,
)]
#[Fillable([
    FeatureOverrideInterface::ATTR_TENANT_ID,
    FeatureOverrideInterface::ATTR_FLAG,
    FeatureOverrideInterface::ATTR_SCOPE_LEVEL,
    FeatureOverrideInterface::ATTR_SCOPE_VALUE,
    FeatureOverrideInterface::ATTR_DECISION,
    FeatureOverrideInterface::ATTR_REASON,
    FeatureOverrideInterface::ATTR_EXPIRES_AT,
])]
#[UseFactory(FeatureOverrideFactory::class)]
#[ObservedBy([FeatureOverrideObserver::class])]
#[WithoutIncrementing]
final class FeatureOverride extends Model implements AuditableContract, FeatureOverrideInterface
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
    public const string ID_PREFIX = 'fo';

    /**
     * Cast map — enum + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FeatureOverrideInterface::ATTR_DECISION   => OverrideDecision::class,
        FeatureOverrideInterface::ATTR_EXPIRES_AT => 'datetime',
    ];
}
