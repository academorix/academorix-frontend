<?php

declare(strict_types=1);

/**
 * HasArchive Trait.
 *
 * Provides an archiving mechanism separate from SoftDeletes. Archived
 * records are excluded from queries by default via a global scope,
 * following the same pattern as Laravel's SoftDeletes trait.
 *
 * Archiving is a reversible, non-destructive state change — the record
 * remains in the database but is hidden from normal queries.
 *
 * ## Required Column:
 * - archived_at (timestamp, nullable)
 *
 * ## Usage:
 * ```php
 * use Stackra\Database\Concerns\Model\HasArchive;
 *
 * class Project extends Model
 * {
 *     use HasArchive;
 * }
 *
 * // Archive a record:
 * $project->archive();
 * $project->isArchived(); // true
 *
 * // Unarchive:
 * $project->unarchive();
 *
 * // Query scopes:
 * Project::query()->get();              // excludes archived (default)
 * Project::withArchived()->get();       // includes archived
 * Project::archived()->get();           // only archived
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Eloquent\SoftDeletes
 * @see \Illuminate\Database\Eloquent\Scope
 */

namespace Stackra\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Provides archiving functionality with a global scope.
 */
trait HasArchive
{
    /**
     * Boot the HasArchive trait.
     *
     * Registers a global scope that excludes archived records from all
     * queries by default. This mirrors the SoftDeletes pattern — use
     * withArchived() to include archived records.
     *
     * @return void
     */
    public static function bootHasArchive(): void
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Archivable) {
                $config = $attr;
                break;
            }
        }

        $column = $config?->column ?? 'archived_at';
        $excludeByDefault = $config?->excludeByDefault ?? true;

        // Add a global scope that filters out archived records by default
        if ($excludeByDefault) {
            static::addGlobalScope('archive', new class($column) implements Scope
            {
                public function __construct(private readonly string $column) {}

                /**
                 * Apply the scope to the given Eloquent query builder.
                 *
                 * @param  Builder<Model>  $builder
                 * @param  Model  $model
                 * @return void
                 */
                public function apply(Builder $builder, Model $model): void
                {
                    $builder->whereNull($this->column);
                }
            });
        }
    }

    // =========================================================================
    // Operations
    // =========================================================================

    /**
     * Archive this record by setting archived_at to the current timestamp.
     *
     * @return static
     */
    public function archive(): static
    {
        $column = $this->resolveArchiveColumn();
        $this->setAttribute($column, now());
        $this->saveQuietly();

        return $this;
    }

    /**
     * Unarchive this record by clearing the archived_at timestamp.
     *
     * @return static
     */
    public function unarchive(): static
    {
        $column = $this->resolveArchiveColumn();
        $this->setAttribute($column, null);
        $this->saveQuietly();

        return $this;
    }

    /**
     * Determine if this record is currently archived.
     *
     * @return bool
     */
    public function isArchived(): bool
    {
        $column = $this->resolveArchiveColumn();

        return $this->getAttribute($column) !== null;
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope to only archived records.
     *
     * Removes the default global scope and adds a NOT NULL constraint.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeArchived($query)
    {
        $column = $this->resolveArchiveColumn();

        return $query->withoutGlobalScope('archive')
            ->whereNotNull($column);
    }

    /**
     * Scope to only non-archived records.
     *
     * This is the default behavior, but can be used explicitly for clarity.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeNotArchived($query)
    {
        $column = $this->resolveArchiveColumn();

        return $query->withoutGlobalScope('archive')
            ->whereNull($column);
    }

    /**
     * Scope to include archived records in the query.
     *
     * Removes the global scope so both archived and non-archived
     * records are returned.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWithArchived($query)
    {
        return $query->withoutGlobalScope('archive');
    }

    // =========================================================================
    // Internal
    // =========================================================================

    /**
     * Resolve the archive column name from the attribute or default.
     *
     * @return string
     */
    protected function resolveArchiveColumn(): string
    {
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Archivable) {
                return $attr->column;
            }
        }

        return 'archived_at';
    }
}
