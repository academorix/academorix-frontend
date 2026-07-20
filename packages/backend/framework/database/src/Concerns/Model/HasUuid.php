<?php

declare(strict_types=1);

/**
 * HasUuid Trait.
 *
 * Auto-generates a UUID v4 on model creation. The UUID can live in a
 * separate column (default: 'uuid') or replace the auto-incrementing
 * primary key entirely when uuidAsKey() returns true.
 *
 * ## Required Column:
 * - uuid (char(36), unique) — or replaces 'id' if uuidAsKey() is true
 *
 * ## Usage:
 * ```php
 * use Academorix\Database\Concerns\Model\HasUuid;
 *
 * // Separate UUID column alongside auto-increment ID:
 * class Post extends Model
 * {
 *     use HasUuid;
 * }
 * // $post->id   → 1
 * // $post->uuid → '550e8400-e29b-41d4-a716-446655440000'
 *
 * // UUID as the primary key (no auto-increment):
 * class Token extends Model
 * {
 *     use HasUuid;
 *
 *     public function uuidAsKey(): bool { return true; }
 * }
 * // $token->id → '550e8400-e29b-41d4-a716-446655440000'
 *
 * // Static finder:
 * Post::findByUuid('550e8400-e29b-41d4-a716-446655440000');
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Support\Str::uuid()
 */

namespace Academorix\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Auto-generates UUID v4 on model creation.
 */
trait HasUuid
{
    /**
     * Boot the HasUuid trait.
     *
     * Registers an Eloquent creating hook that generates a UUID v4
     * if the UUID column is not already populated. This allows
     * pre-setting UUIDs when needed (e.g., imports, tests).
     *
     * @return void
     */
    public static function bootHasUuid(): void
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\UuidColumn) {
                $config = $attr;
                break;
            }
        }

        static::creating(function (Model $model) use ($config): void {
            /** @var Model&HasUuid $model */
            $column = $config?->column ?? $model->uuidColumn();

            // Only generate if the column is empty (allows manual pre-setting)
            if (empty($model->getAttribute($column))) {
                $model->setAttribute($column, (string) Str::uuid());
            }
        });
    }

    // =========================================================================
    // Configuration
    // =========================================================================

    /**
     * Get the column name that stores the UUID.
     *
     * Override this method to use a different column name.
     * The #[UuidColumn] attribute takes priority when present.
     *
     * @return string
     */
    public function uuidColumn(): string
    {
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\UuidColumn) {
                return $attr->column;
            }
        }

        return 'uuid';
    }

    /**
     * Determine if the UUID should be used as the primary key.
     *
     * When true, the model's primary key type is set to 'string'
     * and auto-incrementing is disabled. The #[UuidColumn] attribute
     * takes priority when present.
     *
     * @return bool
     */
    public function uuidAsKey(): bool
    {
        $forClass = \Academorix\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Academorix\Database\Attributes\UuidColumn) {
                return $attr->asKey;
            }
        }

        return false;
    }

    // =========================================================================
    // Key Type Overrides
    // =========================================================================

    /**
     * Get the primary key type.
     *
     * Returns 'string' when UUID is used as the primary key,
     * otherwise defers to Eloquent's default ('int').
     *
     * @return string
     */
    public function getKeyType(): string
    {
        if ($this->uuidAsKey()) {
            return 'string';
        }

        return 'int';
    }

    /**
     * Determine if the model's primary key is auto-incrementing.
     *
     * Returns false when UUID is used as the primary key,
     * otherwise defers to Eloquent's default (true).
     *
     * @return bool
     */
    public function getIncrementing(): bool
    {
        if ($this->uuidAsKey()) {
            return false;
        }

        return true;
    }

    // =========================================================================
    // Scope
    // =========================================================================

    /**
     * Scope to find a record by its UUID.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string  $uuid  The UUID to search for.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWhereUuid($query, string $uuid)
    {
        return $query->where($this->uuidColumn(), $uuid);
    }

    // =========================================================================
    // Static Finder
    // =========================================================================

    /**
     * Find a model by its UUID.
     *
     * @param  string  $uuid  The UUID to search for.
     * @return static|null The model instance or null if not found.
     */
    public static function findByUuid(string $uuid): ?static
    {
        $instance = new static;

        return static::query()
            ->where($instance->uuidColumn(), $uuid)
            ->first();
    }
}
