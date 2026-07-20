<?php

/**
 * @file src/Schema/ScopableBlueprint.php
 *
 * @description
 * Blueprint macro that adds the standard `scope_node_id` column
 * shape to a migration. Registered via `#[AsDatabaseBlueprint]`
 * so `composer dump-autoload` picks it up and the database
 * package's boot phase invokes its `register()`.
 *
 * Pairs with `#[ScopedTo]` on the model side — the migration
 * provides the column, the attribute + discovery pass provides
 * the runtime query filter.
 */

declare(strict_types=1);

namespace Academorix\Scope\Schema;

use Academorix\Database\Attributes\AsDatabaseBlueprint;
use Academorix\Scope\Attributes\ScopedTo;
use Academorix\Scope\Contracts\Data\ScopeNodeInterface;
use Academorix\Scope\Scopes\ScopedGlobalScope;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;

/**
 * Registers the `scopable()` macro on Blueprint.
 *
 * ## What it adds
 *
 *   * A `scope_node_id UUID` column (nullable by default so the
 *     migration doesn't force an atomic insert — the value comes
 *     from the resolver at write time).
 *   * A foreign key to `scope_nodes.id` with `nullOnDelete()` so
 *     a deleted node leaves orphan rows discoverable via a NULL
 *     scan (deliberately not `cascadeOnDelete()` — dropping tenant
 *     data by deleting one node is too dangerous a default).
 *   * A btree index on the column — the resolver's ancestor-chain
 *     `IN (…)` clause is the hot path.
 *
 * ## Basic usage
 *
 * ```php
 * Schema::create('invoices', function (Blueprint $table): void {
 *     $table->uuid('id')->primary();
 *     $table->string('number');
 *     $table->scopable();                      // → scope_node_id column + FK + index
 *     $table->timestamps();
 * });
 * ```
 *
 * ## With a custom column name
 *
 * ```php
 * $table->scopable('parent_scope_id');         // rare — use the default
 * ```
 *
 * ## Not-nullable variant
 *
 * ```php
 * $table->scopable(nullable: false);           // atomically-scoped rows
 * ```
 *
 * @see ScopedTo Model-side pairing.
 * @see ScopedGlobalScope Runtime filter.
 */
#[AsDatabaseBlueprint(
    description: 'Adds scopable() macro — scope_node_id column + FK + index for scope-platform participation.',
    priority: 30,
)]
class ScopableBlueprint
{
    /**
     * Register the `scopable()` macro on the Blueprint class.
     *
     * Uses `Blueprint::macro()` under the hood — no reflection at
     * request time; the macro is a closure captured once at boot.
     */
    public static function register(): void
    {
        Blueprint::macro(
            'scopable',
            function (
                string $column = 'scope_node_id',
                bool $nullable = true,
                bool $foreign = true,
                bool $index = true,
            ): ColumnDefinition {
                /** @var Blueprint $this */
                $definition = $this->uuid($column);

                if ($nullable) {
                    $definition = $definition->nullable();
                }

                // The foreign key is toggleable because some
                // deployments run partitioned tables where FK
                // constraints are not supported (Vitess, some
                // sharded Postgres setups). Turn off with
                // `$table->scopable(foreign: false)`.
                if ($foreign) {
                    $this->foreign($column)
                        ->references(ScopeNodeInterface::PRIMARY_KEY)
                        ->on(ScopeNodeInterface::TABLE)
                        ->nullOnDelete();
                }

                if ($index) {
                    // Named index — deterministic across migrations
                    // so drop/re-add cycles don't drift.
                    $this->index($column, "{$column}_idx");
                }

                return $definition;
            },
        );
    }

    /**
     * Invoke the macro registration.
     *
     * Kept for consistency with sibling blueprints
     * (`SluggableBlueprint`, `ArchivableBlueprint`) which also
     * expose `__invoke()` — some tooling paths look for the magic
     * method rather than the static call.
     */
    public function __invoke(): void
    {
        self::register();
    }
}
