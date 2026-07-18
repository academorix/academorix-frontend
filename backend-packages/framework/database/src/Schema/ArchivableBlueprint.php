<?php

declare(strict_types=1);

/**
 * Archivable Blueprint Schema Macro.
 *
 * Registers the `archivable()` Blueprint macro for adding an archive
 * timestamp column to migration tables. The column is a nullable,
 * indexed timestamp — similar to Laravel's `deleted_at` for SoftDeletes
 * but for a separate archiving concern.
 *
 * ## Column Added:
 * - `archived_at` (timestamp, nullable, indexed) — or custom column name
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('projects', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('name');
 *     $table->archivable();       // Adds 'archived_at' column (nullable timestamp, indexed)
 *     $table->timestamps();
 *     $table->softDeletes();
 * });
 * ```
 *
 * @example Custom column name:
 * ```php
 * Schema::create('documents', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('title');
 *     $table->archivable('hidden_at'); // Custom column name
 *     $table->timestamps();
 * });
 * ```
 *
 * @example With the HasArchive trait:
 * ```php
 * class Project extends Model
 * {
 *     use HasArchive;
 * }
 *
 * $project->archive();
 * $project->isArchived();    // true
 * $project->unarchive();
 *
 * Project::query()->get();          // excludes archived (default)
 * Project::withArchived()->get();   // includes archived
 * Project::archived()->get();       // only archived
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasArchive
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the archivable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: ArchivableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds archivable() macro for archive timestamp columns',
    priority: 20,
)]
class ArchivableBlueprint
{
    /**
     * Register the archivable() macro on the Blueprint class.
     *
     * Creates a nullable timestamp column with an index for efficient
     * filtering of archived vs. non-archived records. The column name
     * defaults to 'archived_at' but can be customized.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('archivable', function (string $column = 'archived_at'): ColumnDefinition {
            /** @var Blueprint $this */

            // Nullable timestamp for archive state — indexed for efficient scope filtering
            return $this->timestamp($column)->nullable()->index();
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
