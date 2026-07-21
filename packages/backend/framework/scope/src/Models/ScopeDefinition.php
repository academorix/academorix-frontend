<?php

/**
 * @file src/Models/ScopeDefinition.php
 *
 * @description
 * Eloquent model for the `scope_definitions` table. Each row is one
 * level in a specific owner's hierarchy — MNGO uses
 * `global → owner → region → venue`, Stackra uses
 * `global → owner → academy → team`. Levels form a strict tree via
 * `parent_slug`; roots have `parent_slug = null`.
 */

declare(strict_types=1);

namespace Stackra\Scope\Models;

use Stackra\Scope\Contracts\Data\ScopeDefinitionInterface;
use Stackra\Scope\Database\Factories\ScopeDefinitionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $owner_id
 * @property string $slug
 * @property string $label
 * @property string|null $parent_slug
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 * @property-read ScopeDefinition|null $parent
 * @property-read Collection<int, ScopeDefinition> $children
 */
#[Table(
    name: ScopeDefinitionInterface::TABLE,
    key: ScopeDefinitionInterface::PRIMARY_KEY,
    keyType: ScopeDefinitionInterface::KEY_TYPE,
)]
#[Fillable([
    // Whitelisted rather than guarded because scope-definition
    // rows are always constructed inside seeders / admin actions
    // where the caller controls every column — the whitelist
    // makes the intent explicit. Per ADR 0006 + architecture rule
    // `ModelUsesFillableAttributeRule`, the mass-assignment
    // policy lives here on the attribute, not on a legacy
    // `protected $fillable` property.
    ScopeDefinitionInterface::ATTR_OWNER_ID,
    ScopeDefinitionInterface::ATTR_SLUG,
    ScopeDefinitionInterface::ATTR_LABEL,
    ScopeDefinitionInterface::ATTR_PARENT_SLUG,
    ScopeDefinitionInterface::ATTR_SORT_ORDER,
])]
#[UseFactory(ScopeDefinitionFactory::class)]
final class ScopeDefinition extends Model implements ScopeDefinitionInterface
{
    /** @use HasFactory<ScopeDefinitionFactory> */
    use HasFactory;

    use HasUuids;
    use SoftDeletes;

    /**
     * Parent definition — nullable, roots have no parent.
     *
     * FK is (`owner_id`, `parent_slug`) → (`owner_id`, `slug`); the
     * relation is scoped by owner so cross-owner joins are
     * impossible even when both sides share a slug.
     *
     * The `->where()` call is chainable at runtime and returns
     * the same relation instance — Laravel's `Relation::where()`
     * delegates to the underlying builder without breaking the
     * fluent chain. PHPStan's Larastan stubs sometimes model
     * this as a Builder, hence the ignore.
     *
     * @return BelongsTo<self, $this>
     */
    public function parent(): BelongsTo
    {
        /** @phpstan-ignore return.type */
        return $this->belongsTo(self::class, self::ATTR_PARENT_SLUG, self::ATTR_SLUG)
            ->where(self::ATTR_OWNER_ID, $this->getAttribute(self::ATTR_OWNER_ID));
    }

    /**
     * Direct children — the definitions whose `parent_slug` matches
     * this one's `slug` for the same owner.
     *
     * @return HasMany<self, $this>
     */
    public function children(): HasMany
    {
        /** @phpstan-ignore return.type */
        return $this->hasMany(self::class, self::ATTR_PARENT_SLUG, self::ATTR_SLUG)
            ->where(self::ATTR_OWNER_ID, $this->getAttribute(self::ATTR_OWNER_ID));
    }

    /**
     * Attribute-cast map. Scope-definition rows are almost entirely
     * strings + one integer + timestamps; only the integer needs
     * casting.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            self::ATTR_SORT_ORDER => 'integer',
        ];
    }
}
