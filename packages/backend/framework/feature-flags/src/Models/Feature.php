<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Models;

use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\FeatureFlags\Contracts\Data\FeatureInterface;
use Stackra\FeatureFlags\Database\Factories\FeatureFactory;
use Stackra\FeatureFlags\Enums\FlagKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see Feature} catalog row.
 *
 * Platform-scoped row on `feature_definitions` — the registry
 * writes it, the resolver's `DefaultLayer` reads `default_off`,
 * and the checker reads `cache_ttl` for per-flag TTL fallback.
 * Does NOT compose `BelongsToTenant`: the catalog spans every
 * tenant, seeded from code via `#[AsFeatureFlag]` discovery.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Table(
    name: FeatureInterface::TABLE,
    key: FeatureInterface::PRIMARY_KEY,
    keyType: FeatureInterface::KEY_TYPE,
)]
#[Fillable([
    FeatureInterface::ATTR_NAME,
    FeatureInterface::ATTR_DESCRIPTION,
    FeatureInterface::ATTR_KIND,
    FeatureInterface::ATTR_DEFAULT_OFF,
    FeatureInterface::ATTR_CACHE_TTL,
])]
#[UseFactory(FeatureFactory::class)]
#[WithoutIncrementing]
final class Feature extends Model implements AuditableContract, FeatureInterface
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
    public const string ID_PREFIX = 'ff';

    /**
     * Cast map — enum + boolean + int coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FeatureInterface::ATTR_KIND        => FlagKind::class,
        FeatureInterface::ATTR_DEFAULT_OFF => 'bool',
        FeatureInterface::ATTR_CACHE_TTL   => 'int',
    ];
}
