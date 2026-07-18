<?php

/**
 * @file src/Migrations/2026_07_11_000003_create_scope_values_table.php
 *
 * @description
 * Creates the `scope_values` table — the namespaced key-value store
 * that consumer packages read from and write to. Cascading DELETE
 * with `scope_nodes` because a node without a home makes no sense.
 */

declare(strict_types=1);

use Academorix\Scope\Contracts\Data\ScopeNodeInterface;
use Academorix\Scope\Contracts\Data\ScopeValueInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Value-store shape rationale:
 *
 *   * Composite unique (scope_node_id, namespace, key) is the
 *     resolver's primary index — a given consumer owns exactly one
 *     value per key per node.
 *   * (namespace, key) helps admin diagnostics ("show every stored
 *     value for setting X across the whole system"). Kept separate
 *     because it's used far less often than the primary lookup.
 *   * value stored as JSON (Postgres → jsonb via the driver's
 *     capabilities detection).
 *   * updated_by is nullable — internal writes (seeders,
 *     scheduled tasks) legitimately have no acting user.
 *   * No soft-deletes — a "forgotten" value is genuinely gone;
 *     the cascade to ancestor values already handles fallback.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create(ScopeValueInterface::TABLE, function (Blueprint $table): void {
            $table->uuid(ScopeValueInterface::ATTR_ID)->primary();

            $table->uuid(ScopeValueInterface::ATTR_SCOPE_NODE_ID);
            $table->foreign(ScopeValueInterface::ATTR_SCOPE_NODE_ID)
                ->references(ScopeNodeInterface::PRIMARY_KEY)
                ->on(ScopeNodeInterface::TABLE)
                ->cascadeOnDelete();

            $table->string(ScopeValueInterface::ATTR_NAMESPACE, 64);
            $table->string(ScopeValueInterface::ATTR_KEY, 255);
            $table->json(ScopeValueInterface::ATTR_VALUE);

            $table->string(ScopeValueInterface::ATTR_UPDATED_BY, 64)->nullable();

            $table->timestamps();

            // Primary lookup — the resolver's hot path.
            $table->unique([
                ScopeValueInterface::ATTR_SCOPE_NODE_ID,
                ScopeValueInterface::ATTR_NAMESPACE,
                ScopeValueInterface::ATTR_KEY,
            ], 'scope_values_node_ns_key_unique');

            // Cross-scope diagnostic index.
            $table->index([
                ScopeValueInterface::ATTR_NAMESPACE,
                ScopeValueInterface::ATTR_KEY,
            ], 'scope_values_ns_key_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ScopeValueInterface::TABLE);
    }
};
