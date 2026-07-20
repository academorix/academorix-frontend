<?php

declare(strict_types=1);

/**
 * Uuidable Blueprint Schema Macro.
 *
 * Registers the `uuidable()` Blueprint macro for adding a UUID column
 * to migration tables. The column is a fixed-length CHAR(36) with a
 * unique constraint and index — suitable for UUID v4 strings.
 *
 * ## Column Added:
 * - `uuid` (char(36), unique, indexed) — or custom column name
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('orders', function (Blueprint $table) {
 *     $table->id();
 *     $table->uuidable();        // Adds 'uuid' column (char(36), unique, indexed)
 *     $table->string('status');
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom column name:
 * ```php
 * Schema::create('tokens', function (Blueprint $table) {
 *     $table->id();
 *     $table->uuidable('external_id'); // Custom column name
 *     $table->timestamps();
 * });
 * ```
 *
 * @example With the HasUuid trait:
 * ```php
 * class Order extends Model
 * {
 *     use HasUuid;
 * }
 *
 * $order = Order::create(['status' => 'pending']);
 * $order->uuid; // → '550e8400-e29b-41d4-a716-446655440000'
 * Order::findByUuid('550e8400-e29b-41d4-a716-446655440000');
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasUuid
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the uuidable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: UuidableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds uuidable() macro for UUID columns',
    priority: 20,
)]
class UuidableBlueprint
{
    /**
     * Register the uuidable() macro on the Blueprint class.
     *
     * Creates a CHAR(36) column with a unique constraint and index.
     * CHAR is preferred over VARCHAR for UUIDs because the length is
     * always exactly 36 characters (8-4-4-4-12 format).
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('uuidable', function (string $column = 'uuid'): ColumnDefinition {
            /** @var Blueprint $this */

            // Fixed-length CHAR(36) for UUID v4 — unique and indexed for fast lookups
            return $this->char($column, 36)->unique()->index();
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
