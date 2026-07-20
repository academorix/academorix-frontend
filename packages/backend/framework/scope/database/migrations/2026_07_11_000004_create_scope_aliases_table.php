<?php

/**
 * @file src/Migrations/2026_07_11_000004_create_scope_aliases_table.php
 *
 * @description
 * Creates the `scope_aliases` table — deployment-specific display
 * label overrides for scope-definition slugs. One row per
 * (owner, slug) pair.
 */

declare(strict_types=1);

use Academorix\Scope\Contracts\Data\ScopeAliasInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The table is intentionally tiny — three business columns plus
 * timestamps — because it's essentially an override lookup. Absent
 * row = definition's original label is used.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create(ScopeAliasInterface::TABLE, function (Blueprint $table): void {
            $table->uuid(ScopeAliasInterface::ATTR_ID)->primary();
            $table->uuid(ScopeAliasInterface::ATTR_OWNER_ID)->index();

            $table->string(ScopeAliasInterface::ATTR_SCOPE_SLUG, 64);
            $table->string(ScopeAliasInterface::ATTR_ALIAS_LABEL, 255);

            $table->timestamps();

            // One alias per (owner, slug) — attempting to set two
            // labels for the same level is a bug we want to surface.
            $table->unique([
                ScopeAliasInterface::ATTR_OWNER_ID,
                ScopeAliasInterface::ATTR_SCOPE_SLUG,
            ], 'scope_aliases_owner_slug_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ScopeAliasInterface::TABLE);
    }
};
