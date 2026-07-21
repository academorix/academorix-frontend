<?php

/**
 * @file src/Migrations/2026_07_11_000002_create_scope_nodes_table.php
 *
 * @description
 * Creates the `scope_nodes` table — the concrete tree of scope
 * instances. One row per real entity (a venue, an academy, a
 * tenant's own root). `materialised_path` is the critical column;
 * see the docblock inside for the indexing strategy.
 */

declare(strict_types=1);

use Stackra\Scope\Contracts\Data\ScopeNodeInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexing strategy:
 *
 *   * Primary key (uuid) — random inserts, fine because scope
 *     trees are small (a few thousand rows at most).
 *   * (owner_id, scope_slug, entity_id) unique — you can't have
 *     two nodes representing the SAME real entity at the same
 *     level for the same owner. This is what lets the resolvers
 *     safely map a tenant id → its scope node.
 *   * (owner_id, parent_node_id) index — the admin UI's "children
 *     of X" queries hit this. Composite because we always scope
 *     by owner.
 *   * materialised_path — a plain BTree index. Ancestor lookup is
 *     an `IN (…)` on the parsed path ids (fast because that's a
 *     PK lookup). Descendant lookup is a `LIKE '/prefix/%'`, which
 *     BTree handles as an indexed range scan.
 *
 *   Postgres users may want to add a GIN index on
 *   `materialised_path` for very deep trees; for the sizes we
 *   expect (< 10 levels, thousands of nodes per owner), BTree
 *   wins on both sides.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create(ScopeNodeInterface::TABLE, function (Blueprint $table): void {
            $table->uuid(ScopeNodeInterface::ATTR_ID)->primary();
            $table->uuid(ScopeNodeInterface::ATTR_OWNER_ID)->index();

            $table->string(ScopeNodeInterface::ATTR_SCOPE_SLUG, 64);
            $table->string(ScopeNodeInterface::ATTR_ENTITY_ID, 255);

            // Self-FK — nodes form a tree rooted at each owner's
            // level-0 node. ON DELETE SET NULL rather than CASCADE
            // because deleting a parent node without moving its
            // children is a mistake we want to surface, not
            // silently prune.
            $table->uuid(ScopeNodeInterface::ATTR_PARENT_NODE_ID)->nullable();
            $table->foreign(ScopeNodeInterface::ATTR_PARENT_NODE_ID)
                ->references(ScopeNodeInterface::PRIMARY_KEY)
                ->on(ScopeNodeInterface::TABLE)
                ->nullOnDelete();

            // Materialised path — kept as `text` because MySQL's
            // varchar(N) is a hard ceiling and a deep-enough tree
            // can outgrow any reasonable N. Postgres's `text` is
            // TOAST-backed so length is effectively unbounded.
            $table->text(ScopeNodeInterface::ATTR_MATERIALISED_PATH);
            $table->unsignedInteger(ScopeNodeInterface::ATTR_DEPTH)->default(0);

            $table->timestamps();
            $table->softDeletes();

            // Uniqueness at (owner, level, real entity id) prevents
            // duplicate node registrations for the same underlying
            // row.
            $table->unique([
                ScopeNodeInterface::ATTR_OWNER_ID,
                ScopeNodeInterface::ATTR_SCOPE_SLUG,
                ScopeNodeInterface::ATTR_ENTITY_ID,
            ], 'scope_nodes_owner_slug_entity_unique');

            $table->index([
                ScopeNodeInterface::ATTR_OWNER_ID,
                ScopeNodeInterface::ATTR_PARENT_NODE_ID,
            ], 'scope_nodes_owner_parent_idx');

            // Path prefix scans hit this. Kept separate from the
            // (owner_id, parent) index because the path already
            // encodes owner scoping.
            $table->index(
                ScopeNodeInterface::ATTR_MATERIALISED_PATH,
                'scope_nodes_path_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ScopeNodeInterface::TABLE);
    }
};
