<?php

/**
 * @file src/Migrations/2026_07_11_000001_create_scope_definitions_table.php
 *
 * @description
 * Creates the `scope_definitions` table — the "level catalogue"
 * per owner. Each row describes ONE hierarchy level (`global`,
 * `owner`, `region`, `venue`, ...) for one owner.
 *
 * Loaded from the package's migration path via the service
 * provider's `LoadsResources(migrations: true)` flag.
 */

declare(strict_types=1);

use Stackra\Scope\Contracts\Data\ScopeDefinitionInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Table shape rationale:
 *
 *   * UUID primary key so scope_nodes / scope_aliases can FK to
 *     definitions safely across owners (numeric IDs would collide).
 *   * `(owner_id, slug)` unique because a slug is per-owner —
 *     different tenants can have completely different trees, and
 *     "venue" may exist in one and not in another.
 *   * `parent_slug` is a string reference within the same owner,
 *     NOT a foreign key. This is intentional — modelling parent as
 *     a self-FK complicates cascading deletes and offers no gain,
 *     since the (owner_id, slug) pair is already unique.
 *   * Soft-deletes because scope-definition retirement is common
 *     during platform evolution ("we no longer use regions"); hard
 *     deletes would orphan every existing node.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create(ScopeDefinitionInterface::TABLE, function (Blueprint $table): void {
            // ── Primary key + owner ───────────────────────────
            $table->uuid(ScopeDefinitionInterface::ATTR_ID)->primary();
            $table->uuid(ScopeDefinitionInterface::ATTR_OWNER_ID)->index();

            // ── Slug + label + parent ────────────────────────
            $table->string(ScopeDefinitionInterface::ATTR_SLUG, 64);
            $table->string(ScopeDefinitionInterface::ATTR_LABEL, 255);
            $table->string(ScopeDefinitionInterface::ATTR_PARENT_SLUG, 64)->nullable();
            $table->unsignedInteger(ScopeDefinitionInterface::ATTR_SORT_ORDER)->default(0);

            // ── Timestamps + soft-deletes ────────────────────
            $table->timestamps();
            $table->softDeletes();

            // A given owner cannot have two definitions with the
            // same slug. Combined with the parent-slug reference,
            // the table forms a strict tree per owner.
            $table->unique([
                ScopeDefinitionInterface::ATTR_OWNER_ID,
                ScopeDefinitionInterface::ATTR_SLUG,
            ], 'scope_definitions_owner_slug_unique');

            // Common admin queries — list levels grouped by parent
            // + ordered by sort. Composite index optimised for the
            // exact WHERE + ORDER BY the UI uses.
            $table->index([
                ScopeDefinitionInterface::ATTR_OWNER_ID,
                ScopeDefinitionInterface::ATTR_PARENT_SLUG,
                ScopeDefinitionInterface::ATTR_SORT_ORDER,
            ], 'scope_definitions_owner_parent_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ScopeDefinitionInterface::TABLE);
    }
};
