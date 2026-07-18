<?php

declare(strict_types=1);

/**
 * HasSortOrder Trait.
 *
 * Manages positional ordering of records within an optional group.
 * Automatically assigns the next sort order on creation and provides
 * methods to move records up, down, to a specific position, or to
 * the top/bottom of the list.
 *
 * All reordering operations use database transactions to handle
 * concurrent updates safely.
 *
 * ## Required Column:
 * - sort_order (integer, default 0)
 *
 * ## Usage:
 * ```php
 * use Academorix\Database\Concerns\Model\HasSortOrder;
 *
 * class MenuItem extends Model
 * {
 *     use HasSortOrder;
 *
 *     // Optional: group ordering by a parent column
 *     public function sortOrderGroup(): array { return ['menu_id']; }
 * }
 *
 * // Auto-assigns sort_order on creation:
 * $item1 = MenuItem::create(['name' => 'Home', 'menu_id' => 1]);    // sort_order = 1
 * $item2 = MenuItem::create(['name' => 'About', 'menu_id' => 1]);   // sort_order = 2
 *
 * // Reorder:
 * $item2->moveUp();       // swaps with $item1
 * $item1->moveToBottom(); // moves to last position
 *
 * // Query ordered:
 * MenuItem::ordered()->get();
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Support\Facades\DB::transaction()
 */

namespace Academorix\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Manages positional ordering of records within a group.
 */
trait HasSortOrder
{
    /**
     * Boot the HasSortOrder trait.
     *
     * Registers an Eloquent creating hook that assigns the next
     * available sort order within the configured group.
     *
     * @return void
     */
    public static function bootHasSortOrder(): void
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\SortableModel) {
                $config = $attr;
                break;
            }
        }

        static::creating(function (Model $model) use ($config): void {
            /** @var Model&HasSortOrder $model */
            $column = $config?->column ?? $model->sortOrderColumn();

            // Only auto-assign if sort_order was not explicitly set
            if ($model->getAttribute($column) === null || $model->getAttribute($column) === 0) {
                $maxOrder = $model->buildGroupQuery($config)
                    ->max($column);

                // Assign the next position (max + 1), starting at 1
                $model->setAttribute($column, ((int) $maxOrder) + 1);
            }
        });
    }

    // =========================================================================
    // Configuration
    // =========================================================================

    /**
     * Get the column name used for sort ordering.
     *
     * @return string
     */
    public function sortOrderColumn(): string
    {
        return 'sort_order';
    }

    /**
     * Get the columns that define the ordering group.
     *
     * Records are ordered independently within each group.
     * Return an empty array for global ordering.
     *
     * @return array<string> Column names that define the group (e.g., ['category_id']).
     *
     * @example
     * // Per-category ordering:
     * public function sortOrderGroup(): array { return ['category_id']; }
     */
    public function sortOrderGroup(): array
    {
        return [];
    }

    // =========================================================================
    // Operations
    // =========================================================================

    /**
     * Move this record one position up (swap with the previous record).
     *
     * @return static
     */
    public function moveUp(): static
    {
        $column = $this->sortOrderColumn();
        $currentOrder = (int) $this->getAttribute($column);

        return DB::transaction(function () use ($column, $currentOrder): static {
            // Find the record directly above this one
            $previous = $this->buildGroupQuery()
                ->where($column, '<', $currentOrder)
                ->orderByDesc($column)
                ->first();

            if ($previous !== null) {
                $previousOrder = (int) $previous->getAttribute($column);

                // Swap positions
                $previous->setAttribute($column, $currentOrder);
                $previous->saveQuietly();

                $this->setAttribute($column, $previousOrder);
                $this->saveQuietly();
            }

            return $this;
        });
    }

    /**
     * Move this record one position down (swap with the next record).
     *
     * @return static
     */
    public function moveDown(): static
    {
        $column = $this->sortOrderColumn();
        $currentOrder = (int) $this->getAttribute($column);

        return DB::transaction(function () use ($column, $currentOrder): static {
            // Find the record directly below this one
            $next = $this->buildGroupQuery()
                ->where($column, '>', $currentOrder)
                ->orderBy($column)
                ->first();

            if ($next !== null) {
                $nextOrder = (int) $next->getAttribute($column);

                // Swap positions
                $next->setAttribute($column, $currentOrder);
                $next->saveQuietly();

                $this->setAttribute($column, $nextOrder);
                $this->saveQuietly();
            }

            return $this;
        });
    }

    /**
     * Move this record to a specific position, shifting others accordingly.
     *
     * @param  int  $position  The target position (1-based).
     * @return static
     */
    public function moveTo(int $position): static
    {
        $column = $this->sortOrderColumn();
        $currentOrder = (int) $this->getAttribute($column);

        if ($currentOrder === $position) {
            return $this;
        }

        return DB::transaction(function () use ($column, $currentOrder, $position): static {
            if ($position < $currentOrder) {
                // Moving up: shift records in [position, currentOrder) down by 1
                $this->buildGroupQuery()
                    ->where($column, '>=', $position)
                    ->where($column, '<', $currentOrder)
                    ->increment($column);
            } else {
                // Moving down: shift records in (currentOrder, position] up by 1
                $this->buildGroupQuery()
                    ->where($column, '>', $currentOrder)
                    ->where($column, '<=', $position)
                    ->decrement($column);
            }

            $this->setAttribute($column, $position);
            $this->saveQuietly();

            return $this;
        });
    }

    /**
     * Move this record to the first position.
     *
     * @return static
     */
    public function moveToTop(): static
    {
        return $this->moveTo(1);
    }

    /**
     * Move this record to the last position.
     *
     * @return static
     */
    public function moveToBottom(): static
    {
        $column = $this->sortOrderColumn();

        $maxOrder = (int) $this->buildGroupQuery()->max($column);

        return $this->moveTo($maxOrder);
    }

    // =========================================================================
    // Scope
    // =========================================================================

    /**
     * Scope to order records by their sort order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string  $direction  Sort direction ('asc' or 'desc').
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeOrdered($query, string $direction = 'asc')
    {
        return $query->orderBy($this->sortOrderColumn(), $direction);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Determine if this record is the first in its group.
     *
     * @return bool
     */
    public function isFirst(): bool
    {
        $column = $this->sortOrderColumn();
        $minOrder = (int) $this->buildGroupQuery()->min($column);

        return (int) $this->getAttribute($column) === $minOrder;
    }

    /**
     * Determine if this record is the last in its group.
     *
     * @return bool
     */
    public function isLast(): bool
    {
        $column = $this->sortOrderColumn();
        $maxOrder = (int) $this->buildGroupQuery()->max($column);

        return (int) $this->getAttribute($column) === $maxOrder;
    }

    // =========================================================================
    // Internal
    // =========================================================================

    /**
     * Build a query scoped to the current record's ordering group.
     *
     * Applies WHERE clauses for each group column so that ordering
     * operations only affect records in the same group.
     *
     * @param  \Academorix\Database\Attributes\SortableModel|null  $config  Optional attribute configuration.
     * @return Builder<static>
     */
    protected function buildGroupQuery(?\Academorix\Database\Attributes\SortableModel $config = null): Builder
    {
        $query = static::query();

        // Attribute group takes priority, then method override
        $group = $config?->group ?? null;
        if ($group === null || $group === []) {
            $group = $this->sortOrderGroup();
        }

        // Scope the query to the same group as this record
        foreach ($group as $groupColumn) {
            $query->where($groupColumn, $this->getAttribute($groupColumn));
        }

        return $query;
    }
}
