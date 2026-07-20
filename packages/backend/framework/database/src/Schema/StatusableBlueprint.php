<?php

declare(strict_types=1);

/**
 * Statusable Blueprint Schema Macro.
 *
 * Registers the `statusable()` Blueprint macro for adding a status column
 * to migration tables. The column is a short string (max 50 chars) with
 * a configurable default value and an index for efficient filtering.
 *
 * ## Column Added:
 * - `status` (string(50), default 'pending', indexed) — or custom column/default
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('orders', function (Blueprint $table) {
 *     $table->id();
 *     $table->decimal('total', 10, 2);
 *     $table->statusable();       // Adds 'status' column (default 'pending', indexed)
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Custom default and column name:
 * ```php
 * Schema::create('tickets', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('subject');
 *     $table->statusable('open', 'ticket_status'); // default 'open', column 'ticket_status'
 *     $table->timestamps();
 * });
 * ```
 *
 * @example With the HasStatus trait and enum:
 * ```php
 * enum OrderStatus: string
 * {
 *     case Pending = 'pending';
 *     case Processing = 'processing';
 *     case Shipped = 'shipped';
 *     case Cancelled = 'cancelled';
 *
 *     public function allowedTransitions(): array { ... }
 *     public function canTransitionTo(self $target): bool { ... }
 * }
 *
 * class Order extends Model
 * {
 *     use HasStatus;
 *
 *     public function statusEnum(): string { return OrderStatus::class; }
 * }
 *
 * $order->transitionTo(OrderStatus::Processing);
 * Order::whereStatus(OrderStatus::Pending)->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasStatus
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the statusable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: StatusableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds statusable() macro for status columns with default value',
    priority: 20,
)]
class StatusableBlueprint
{
    /**
     * Register the statusable() macro on the Blueprint class.
     *
     * Creates a string(50) column with a configurable default value
     * and an index for efficient WHERE status = ? queries. The short
     * length (50) is intentional — status values should be concise
     * enum-backed strings.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('statusable', function (string $default = 'pending', string $column = 'status'): ColumnDefinition {
            /** @var Blueprint $this */

            // Short string for status values — default provided, indexed for efficient filtering
            return $this->string($column, 50)->default($default)->index();
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
