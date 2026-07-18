<?php

/**
 * @file src/Models/ScopeNode.php
 *
 * @description
 * Eloquent model for the `scope_nodes` table. A node is one
 * concrete instance in the tree — e.g. venue #42 for owner #7, or
 * the owner's own root node. Every node carries a materialised
 * path so ancestor traversal is a single indexed prefix scan.
 */

declare(strict_types=1);

namespace Academorix\Scope\Models;

use Academorix\Scope\Contracts\Data\ScopeNodeInterface;
use Academorix\Scope\Database\Factories\ScopeNodeFactory;
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
 * @property string $scope_slug
 * @property string $entity_id
 * @property string|null $parent_node_id
 * @property string $materialised_path
 * @property int $depth
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Carbon|null $deleted_at
 * @property-read ScopeNode|null $parent
 * @property-read Collection<int, ScopeNode> $children
 * @property-read Collection<int, ScopeValue> $values
 */
#[Table(
    name: ScopeNodeInterface::TABLE,
    key: ScopeNodeInterface::PRIMARY_KEY,
    keyType: ScopeNodeInterface::KEY_TYPE,
)]
#[Fillable([
    // Materialised_path + depth stay on the fillable list because
    // node creation always happens through an orchestrator that
    // computes both (never a bare `Model::create()` with values
    // from user input). The architecture rule is satisfied by the
    // attribute; the runtime safety is a repository invariant.
    ScopeNodeInterface::ATTR_OWNER_ID,
    ScopeNodeInterface::ATTR_SCOPE_SLUG,
    ScopeNodeInterface::ATTR_ENTITY_ID,
    ScopeNodeInterface::ATTR_PARENT_NODE_ID,
    ScopeNodeInterface::ATTR_MATERIALISED_PATH,
    ScopeNodeInterface::ATTR_DEPTH,
])]
#[UseFactory(ScopeNodeFactory::class)]
final class ScopeNode extends Model implements ScopeNodeInterface
{
    /** @use HasFactory<ScopeNodeFactory> */
    use HasFactory;

    use HasUuids;
    use SoftDeletes;

    // ══════════════════════════════════════════════════════════════════
    // Relations
    // ══════════════════════════════════════════════════════════════════

    /**
     * Parent node — nullable, roots have no parent.
     *
     * @return BelongsTo<self, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, self::ATTR_PARENT_NODE_ID);
    }

    /**
     * Direct children. Descendants at greater depths are reached by
     * a materialised-path prefix query, not this relation.
     *
     * @return HasMany<self, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, self::ATTR_PARENT_NODE_ID);
    }

    /**
     * Every value stored AT this exact node. Ancestor values are NOT
     * included — the resolver walks the path explicitly.
     *
     * @return HasMany<ScopeValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(ScopeValue::class, ScopeValue::ATTR_SCOPE_NODE_ID);
    }

    // ══════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════

    /**
     * Return the ordered list of ancestor UUIDs, root → self. Parsed
     * from `materialised_path`.
     *
     * @return list<string>
     */
    public function ancestorIds(): array
    {
        return array_values(array_filter(explode('/', (string) $this->materialised_path)));
    }

    /**
     * True when this node is an ancestor of (or equal to) `$other`.
     *
     * Cheap because both paths are strings — a single `str_starts_with`
     * decides ancestry without loading the tree.
     */
    public function isAncestorOf(ScopeNode $other): bool
    {
        return str_starts_with(
            (string) $other->materialised_path,
            (string) $this->materialised_path,
        );
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            self::ATTR_DEPTH => 'integer',
        ];
    }
}
