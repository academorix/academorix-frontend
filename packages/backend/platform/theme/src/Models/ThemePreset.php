<?php

declare(strict_types=1);

namespace Stackra\Theme\Models;

use Stackra\Foundation\Concerns\HasMetadata;
use Stackra\Foundation\Concerns\HasPrefixedUlid;
use Stackra\Theme\Contracts\Data\ThemePresetInterface;
use Stackra\Theme\Database\Factories\ThemePresetFactory;
use Stackra\Theme\Enums\ThemePresetCategory;
use Stackra\Theme\Enums\ThemePresetMode;
use Stackra\Theme\Observers\ThemePresetObserver;
use Stackra\Theme\Policies\ThemePresetPolicy;
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
 * Eloquent model for a `theme_presets` row.
 *
 * Dual-source catalogue (see `.kiro/steering/enum-db-seed-dual-source.md`):
 * `is_system = true` rows mirror every non-`Custom` case of
 * {@see \Stackra\Theme\Enums\ThemePresetSlug} and are IMMUTABLE outside
 * the seeder. Tenant-authored presets are `is_system = false` with a
 * non-null `tenant_id`.
 *
 * The nullable `tenant_id` is deliberate: platform-shipped presets have
 * `tenant_id = null` and are visible to every tenant; tenant customs
 * carry the owner's tenant. Because of that duality this model does NOT
 * compose `BelongsToTenant` — the visibility rule is
 * `tenant_id = active_tenant OR tenant_id IS NULL`, applied by a
 * ScopedGlobalScope registered on the platform-preset-aware repository.
 *
 * @category Theme
 *
 * @since    0.1.0
 */
#[Table(
    name: ThemePresetInterface::TABLE,
    key: ThemePresetInterface::PRIMARY_KEY,
    keyType: ThemePresetInterface::KEY_TYPE,
)]
#[Fillable([
    ThemePresetInterface::ATTR_TENANT_ID,
    ThemePresetInterface::ATTR_SLUG,
    ThemePresetInterface::ATTR_NAME,
    ThemePresetInterface::ATTR_DESCRIPTION,
    ThemePresetInterface::ATTR_MODE,
    ThemePresetInterface::ATTR_CATEGORY,
    ThemePresetInterface::ATTR_TOKENS,
    ThemePresetInterface::ATTR_PREVIEW_THUMBNAIL_URL,
    ThemePresetInterface::ATTR_IS_ACTIVE,
    ThemePresetInterface::ATTR_IS_SYSTEM,
    ThemePresetInterface::ATTR_CREATED_BY_USER_ID,
    ThemePresetInterface::ATTR_METADATA,
])]
#[UseFactory(ThemePresetFactory::class)]
#[UsePolicy(ThemePresetPolicy::class)]
#[ObservedBy([ThemePresetObserver::class])]
#[WithoutIncrementing]
final class ThemePreset extends Model implements AuditableContract, ThemePresetInterface
{
    use Auditable;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Process-lifetime flag that opens the mutation-allowed scope for
     * system rows. Set only by {@see self::allowSystemMutation()} — every
     * observer read of it goes through {@see self::isSystemMutationAllowed()}.
     */
    private static bool $systemMutationAllowed = false;

    /** @var array<string, string> */
    protected $casts = [
        ThemePresetInterface::ATTR_MODE      => ThemePresetMode::class,
        ThemePresetInterface::ATTR_CATEGORY  => ThemePresetCategory::class,
        ThemePresetInterface::ATTR_TOKENS    => 'array',
        ThemePresetInterface::ATTR_IS_ACTIVE => 'boolean',
        ThemePresetInterface::ATTR_IS_SYSTEM => 'boolean',
        ThemePresetInterface::ATTR_METADATA  => 'array',
    ];

    /**
     * Run `$callback` with the system-row mutation guard temporarily
     * disabled. The ONLY sanctioned way to touch `is_system = true`
     * rows — the seeder + tests that fixture system state.
     *
     * @template T
     *
     * @param  Closure(): T  $callback  Code that legitimately mutates system rows.
     * @return T  Whatever the callback returns.
     */
    public static function allowSystemMutation(Closure $callback): mixed
    {
        $previous = self::$systemMutationAllowed;
        self::$systemMutationAllowed = true;

        try {
            return $callback();
        } finally {
            self::$systemMutationAllowed = $previous;
        }
    }

    /**
     * True when the current call stack is inside an
     * {@see self::allowSystemMutation()} closure. The observer reads
     * this to decide whether to raise `ThemePresetSystemImmutableException`.
     */
    public static function isSystemMutationAllowed(): bool
    {
        return self::$systemMutationAllowed;
    }
}
