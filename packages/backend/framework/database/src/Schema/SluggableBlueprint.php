<?php

declare(strict_types=1);

/**
 * Sluggable Blueprint Schema Macro.
 *
 * Registers the `sluggable()` Blueprint macro for adding a URL-friendly
 * slug column to migration tables. The slug column is created as a unique,
 * indexed string — ideal for SEO-friendly URLs and route model binding.
 *
 * ## Column Added:
 * - `slug` (string, unique, indexed) — or custom column name
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('posts', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('title');
 *     $table->sluggable();       // Adds 'slug' column (unique + indexed)
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name:
 * ```php
 * Schema::create('categories', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->sluggable('url_slug'); // Custom column name
 *     $table->timestamps();
 * });
 * ```
 *
 * @example With the HasSlug trait:
 * ```php
 * class Post extends Model
 * {
 *     use HasSlug;
 *
 *     public function slugSource(): string { return 'title'; }
 * }
 *
 * $post = Post::create(['title' => 'Hello World']);
 * $post->slug; // → 'hello-world'
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasSlug
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the sluggable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: SluggableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds sluggable() macro for URL-friendly slug columns',
    priority: 20,
)]
class SluggableBlueprint
{
    /**
     * Register the sluggable() macro on the Blueprint class.
     *
     * Creates a string column with a unique constraint and an index
     * for fast lookups. The column name defaults to 'slug' but can
     * be customized via the $column parameter.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('sluggable', function (string $column = 'slug'): ColumnDefinition {
            /** @var Blueprint $this */

            // URL-friendly slug column — unique to prevent duplicates, indexed for fast lookups
            return $this->string($column)->unique()->index();
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
