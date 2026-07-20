<?php

/**
 * @file src/Models/ScopeValue.php
 *
 * @description
 * Eloquent model for the `scope_values` table — a namespaced
 * key-value store keyed by node id. Reads never happen directly on
 * this model in application code; go through
 * {@see \Academorix\Scope\Contracts\ScopeResolutionInterface::resolve()}
 * so the cascading path is applied.
 */

declare(strict_types=1);

namespace Academorix\Scope\Models;

use Academorix\Scope\Contracts\Data\ScopeValueInterface;
use Academorix\Scope\Database\Factories\ScopeValueFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $scope_node_id
 * @property string $namespace
 * @property string $key
 * @property mixed $value
 * @property string|null $updated_by
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read ScopeNode $node
 */
#[Table(
    name: ScopeValueInterface::TABLE,
    key: ScopeValueInterface::PRIMARY_KEY,
    keyType: ScopeValueInterface::KEY_TYPE,
)]
#[Fillable([
    // Every field on the value table is writable through the
    // resolver's `write()` — no computed columns, no guards.
    ScopeValueInterface::ATTR_SCOPE_NODE_ID,
    ScopeValueInterface::ATTR_NAMESPACE,
    ScopeValueInterface::ATTR_KEY,
    ScopeValueInterface::ATTR_VALUE,
    ScopeValueInterface::ATTR_UPDATED_BY,
])]
#[UseFactory(ScopeValueFactory::class)]
final class ScopeValue extends Model implements ScopeValueInterface
{
    /** @use HasFactory<ScopeValueFactory> */
    use HasFactory;

    use HasUuids;

    /**
     * Owning node. FK is `scope_node_id` → `scope_nodes.id` with
     * ON DELETE CASCADE, so a node's values disappear with it.
     *
     * @return BelongsTo<ScopeNode, $this>
     */
    public function node(): BelongsTo
    {
        return $this->belongsTo(ScopeNode::class, self::ATTR_SCOPE_NODE_ID);
    }

    /**
     * Cast `value` to array/object automatically — the column is
     * JSON in every supported driver. Consumers get back a decoded
     * PHP value; the type contract is enforced by the consumer's
     * validator, not by the model.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            self::ATTR_VALUE => 'json',
        ];
    }
}
