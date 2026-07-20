<?php

declare(strict_types=1);

namespace Academorix\Application\Models;

use Academorix\Application\Contracts\Data\BusinessTypeInterface;
use Academorix\Application\Database\Factories\BusinessTypeFactory;
use Academorix\Application\Observers\BusinessTypeObserver;
use Academorix\Application\Policies\BusinessTypePolicy;
use Academorix\Database\Concerns\HasMetadata;
use Academorix\Database\Concerns\HasPrefixedUlid;
use Academorix\Database\Concerns\HasSystemFlag;
use Academorix\Database\Concerns\HasTranslations;
use Closure;
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
 * Eloquent model for a {@see BusinessTypeInterface}.
 *
 * Dual-source per `.kiro/steering/enum-db-seed-dual-source.md`. Rows
 * with `tenant_id = null` + `is_system = true` are platform-seeded
 * from `BusinessTypeEnum` cases via `BusinessTypeSeeder`; rows with
 * `tenant_id` set are tenant customs (`is_system = false`).
 *
 * System-row mutations are refused outside the sanctioned scope —
 * open it via {@see self::allowSystemMutation()} in seeders + tests
 * only. Never bypass by writing directly through the model in prod.
 */
#[Table(
    name: BusinessTypeInterface::TABLE,
    key: BusinessTypeInterface::PRIMARY_KEY,
    keyType: BusinessTypeInterface::KEY_TYPE,
)]
#[Fillable([
    BusinessTypeInterface::ATTR_TENANT_ID,
    BusinessTypeInterface::ATTR_SLUG,
    BusinessTypeInterface::ATTR_LABEL,
    BusinessTypeInterface::ATTR_DESCRIPTION,
    BusinessTypeInterface::ATTR_ICON,
    BusinessTypeInterface::ATTR_HERO_IMAGE_URL,
    BusinessTypeInterface::ATTR_SORT_ORDER,
    BusinessTypeInterface::ATTR_IS_SYSTEM,
    BusinessTypeInterface::ATTR_IS_VISIBLE,
    BusinessTypeInterface::ATTR_TRANSLATIONS,
    BusinessTypeInterface::ATTR_METADATA,
])]
#[UseFactory(BusinessTypeFactory::class)]
#[UsePolicy(BusinessTypePolicy::class)]
#[ObservedBy([BusinessTypeObserver::class])]
#[WithoutIncrementing]
final class BusinessType extends Model implements AuditableContract, BusinessTypeInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use HasSystemFlag;
    use HasTranslations;
    use SoftDeletes;
    use Userstamps;

    /**
     * Fields covered by `HasTranslations` (spatie/laravel-translatable).
     * The `translations` JSONB column stores per-locale copies.
     *
     * @var list<string>
     */
    public array $translatable = [
        BusinessTypeInterface::ATTR_LABEL,
        BusinessTypeInterface::ATTR_DESCRIPTION,
    ];

    /**
     * Whether the seeder / tests have opened the system-mutation scope.
     * The observer inspects this flag on `saving` / `deleting` to
     * decide whether to refuse the write.
     */
    private static bool $systemMutationAllowed = false;

    /**
     * Cast map.
     *
     * @var array<string, string>
     */
    protected $casts = [
        BusinessTypeInterface::ATTR_IS_SYSTEM    => 'boolean',
        BusinessTypeInterface::ATTR_IS_VISIBLE   => 'boolean',
        BusinessTypeInterface::ATTR_SORT_ORDER   => 'integer',
        BusinessTypeInterface::ATTR_TRANSLATIONS => 'array',
        BusinessTypeInterface::ATTR_METADATA     => 'array',
    ];

    /**
     * Open the system-mutation scope for the duration of the closure.
     *
     * The seeder + fixture-building tests wrap their writes in this
     * scope so the observer's immutability guardrail relaxes. Any
     * other caller that reaches for this method is doing something
     * wrong — refactor to route through the seeder instead.
     *
     * @template TReturn
     *
     * @param  Closure(): TReturn  $closure
     * @return TReturn
     */
    public static function allowSystemMutation(Closure $closure): mixed
    {
        $previous = self::$systemMutationAllowed;
        self::$systemMutationAllowed = true;

        try {
            return $closure();
        } finally {
            self::$systemMutationAllowed = $previous;
        }
    }

    /**
     * Inspected by {@see BusinessTypeObserver} on `saving` / `deleting`.
     */
    public static function isSystemMutationAllowed(): bool
    {
        return self::$systemMutationAllowed;
    }
}
