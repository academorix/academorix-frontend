<?php

declare(strict_types=1);

/**
 * Taggable Blueprint Schema Helpers.
 *
 * Provides static helper methods for creating and dropping the `tags`
 * and `taggables` pivot tables required by the polymorphic tagging system.
 * Unlike other Blueprint macros, tagging uses dedicated pivot tables rather
 * than adding columns to the model's own table.
 *
 * ## Tables Created:
 *
 * ### `tags` table:
 * - `id` (bigIncrements) — primary key
 * - `name` (string) — tag display name
 * - `slug` (string, unique) — URL-friendly tag identifier
 * - `type` (string, nullable) — optional tag type/category for grouping
 * - `created_at`, `updated_at` (timestamps)
 *
 * ### `taggables` pivot table:
 * - `id` (bigIncrements) — primary key
 * - `tag_id` (foreignId) — FK to tags table, cascades on delete
 * - `taggable_type` (string) — morph class of the tagged model
 * - `taggable_id` (unsignedBigInteger) — primary key of the tagged model
 * - `created_at`, `updated_at` (timestamps)
 * - Unique constraint on [tag_id, taggable_type, taggable_id]
 *
 * @example Creating tables in a migration:
 * ```php
 * use Academorix\Database\Schema\TaggableBlueprint;
 *
 * public function up(): void
 * {
 *     TaggableBlueprint::createTagsTable();
 *     TaggableBlueprint::createTaggablesTable();
 * }
 *
 * public function down(): void
 * {
 *     TaggableBlueprint::dropTaggablesTable();
 *     TaggableBlueprint::dropTagsTable();
 * }
 * ```
 *
 * @example With the HasTags trait:
 * ```php
 * class Post extends Model
 * {
 *     use HasTags;
 * }
 *
 * $post->attachTag('laravel');
 * $post->syncTags(['laravel', 'php', 'eloquent']);
 * $post->hasTag('laravel');              // true
 * Post::withTag('laravel')->get();
 * Post::withAllTags(['laravel', 'php'])->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasTags
 * @see \Academorix\Crud\Models\Tag
 * @see \Illuminate\Database\Schema\Blueprint
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Provides static helpers for creating/dropping tag and taggable pivot tables.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * No column macro is registered — tagging uses pivot tables, not inline columns.
 */
#[AsDatabaseBlueprint(
    description: 'Adds taggable() helper and createTaggablesTable() for polymorphic tagging',
    priority: 30,
)]
class TaggableBlueprint
{
    /**
     * Register method — no column macro needed for tagging.
     *
     * Tagging uses dedicated pivot tables (tags + taggables) rather than
     * adding columns to the model's own table. Use the static helper
     * methods createTagsTable() and createTaggablesTable() in migrations.
     *
     * @return void
     */
    public static function register(): void
    {
        // No column macro needed — tagging uses a pivot table.
        // Provide static helpers for creating the tags and taggables tables.
    }

    /**
     * Create the `tags` table.
     *
     * Stores tag definitions with a name, URL-friendly slug, and an
     * optional type column for categorizing tags into groups.
     *
     * @return void
     */
    public static function createTagsTable(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Tag display name — indexed for search queries
            $table->string('name');

            // URL-friendly slug — unique to prevent duplicate tags
            $table->string('slug')->unique();

            // Optional tag type/category for grouping (e.g., 'color', 'size', 'topic')
            $table->string('type')->nullable();

            // Laravel timestamps
            $table->timestamps();

            // Index on name for efficient tag lookups
            $table->index('name');
        });
    }

    /**
     * Create the `taggables` polymorphic pivot table.
     *
     * Links tags to any taggable model via Laravel's morphMany pattern.
     * The unique constraint prevents the same tag from being attached
     * to the same model instance more than once.
     *
     * @return void
     */
    public static function createTaggablesTable(): void
    {
        Schema::create('taggables', function (Blueprint $table) {
            // Primary key
            $table->id();

            // Foreign key to the tags table — cascades on delete
            $table->foreignId('tag_id')->constrained('tags')->cascadeOnDelete();

            // Polymorphic morph columns — taggable_type and taggable_id
            $table->morphs('taggable');

            // Laravel timestamps
            $table->timestamps();

            // Unique constraint — prevent duplicate tag assignments per model
            $table->unique(['tag_id', 'taggable_type', 'taggable_id']);
        });
    }

    /**
     * Drop the `taggables` pivot table.
     *
     * Should be called before dropTagsTable() due to the foreign key constraint.
     *
     * @return void
     */
    public static function dropTaggablesTable(): void
    {
        Schema::dropIfExists('taggables');
    }

    /**
     * Drop the `tags` table.
     *
     * Should be called after dropTaggablesTable() to avoid FK constraint violations.
     *
     * @return void
     */
    public static function dropTagsTable(): void
    {
        Schema::dropIfExists('tags');
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
