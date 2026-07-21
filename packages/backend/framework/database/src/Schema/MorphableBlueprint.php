<?php

declare(strict_types=1);

/**
 * Morphable Blueprint Schema Macro.
 *
 * Registers the `morphable()` Blueprint macro for adding generic
 * polymorphic relationship columns to migration tables. This is a
 * convenience wrapper around Laravel's morphs() pattern, with added
 * control over nullability and automatic composite indexing.
 *
 * ## Columns Added (for a given $name):
 * - `{$name}_type` (string, nullable by default) — morph class name
 * - `{$name}_id` (unsignedBigInteger, nullable by default) — morph primary key
 *
 * ## Indexes:
 * - Composite index on [{$name}_type, {$name}_id]
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('comments', function (Blueprint $table) {
 *     $table->id();
 *     $table->morphable('commentable');  // Adds commentable_type + commentable_id (nullable)
 *     $table->text('body');
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Non-nullable morph columns:
 * ```php
 * Schema::create('images', function (Blueprint $table) {
 *     $table->id();
 *     $table->morphable('imageable', nullable: false); // Required morph columns
 *     $table->string('path');
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Multiple polymorphic relationships:
 * ```php
 * Schema::create('activity_log', function (Blueprint $table) {
 *     $table->id();
 *     $table->morphable('subject');   // The entity being acted upon
 *     $table->morphable('causer');    // The user/system that caused the action
 *     $table->string('action');
 *     $table->timestamps();
 * });
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Eloquent\Relations\MorphTo
 * @see \Illuminate\Database\Schema\Blueprint::morphs()
 * @see \Illuminate\Database\Schema\Blueprint
 */

namespace Stackra\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Stackra\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the morphable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: MorphableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds morphable() macro for polymorphic relationship columns',
    priority: 15,
)]
class MorphableBlueprint
{
    /**
     * Register the morphable() macro on the Blueprint class.
     *
     * Creates a pair of polymorphic columns ({name}_type and {name}_id)
     * with optional nullability and a composite index for efficient
     * polymorphic lookups.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('morphable', function (string $name, bool $nullable = true): void {
            /** @var Blueprint $this */

            // Morph type column — stores the fully qualified class name of the related model
            $typeCol = $this->string("{$name}_type");

            // Morph ID column — stores the primary key of the related model
            $idCol = $this->unsignedBigInteger("{$name}_id");

            // Apply nullability — nullable by default for optional relationships
            if ($nullable) {
                $typeCol->nullable();
                $idCol->nullable();
            }

            // Composite index for efficient polymorphic lookups (type + id)
            $this->index(["{$name}_type", "{$name}_id"]);
        });
    }

    /**
     * Invoke the macro registration (for auto-discovery via #[AsDatabaseBlueprint]).
     *
     * @return void
     */
    public function __invoke(): void
    {
        self::register();
    }
}
