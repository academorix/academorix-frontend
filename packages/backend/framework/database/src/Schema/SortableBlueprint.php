<?php

declare(strict_types=1);

/**
 * Sortable Blueprint Schema Macro.
 *
 * Registers the `sortable()` Blueprint macro for adding a positional
 * ordering column to migration tables. The column is an unsigned integer
 * defaulting to 0, with an index for efficient ORDER BY queries.
 *
 * ## Column Added:
 * - `sort_order` (unsigned integer, default 0, indexed) — or custom column name
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('menu_items', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('label');
 *     $table->sortable();         // Adds 'sort_order' column (unsigned int, default 0, indexed)
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name:
 * ```php
 * Schema::create('playlist_tracks', function (Blueprint $table) {
 *     $table->id();
 *     $table->foreignId('playlist_id')->constrained();
 *     $table->foreignId('track_id')->constrained();
 *     $table->sortable('position'); // Custom column name
 *     $table->timestamps();
 * });
 * ```
 *
 * @example With the HasSortOrder trait:
 * ```php
 * class MenuItem extends Model
 * {
 *     use HasSortOrder;
 *
 *     public function sortOrderGroup(): array { return ['menu_id']; }
 * }
 *
 * $item = MenuItem::create(['label' => 'Home', 'menu_id' => 1]); // sort_order = 1
 * $item->moveUp();
 * $item->moveToBottom();
 * MenuItem::ordered()->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasSortOrder
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Stackra\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Stackra\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the sortable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: SortableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds sortable() macro for positional ordering columns',
    priority: 20,
)]
class SortableBlueprint
{
    /**
     * Register the sortable() macro on the Blueprint class.
     *
     * Creates an unsigned integer column with a default value of 0
     * and an index for efficient ORDER BY queries. The column name
     * defaults to 'sort_order' but can be customized.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('sortable', function (string $column = 'sort_order'): ColumnDefinition {
            /** @var Blueprint $this */

            // Unsigned integer for positional ordering — default 0, indexed for ORDER BY performance
            return $this->integer($column)->unsigned()->default(0)->index();
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
