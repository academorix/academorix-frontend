<?php

/**
 * @file src/Contracts/Data/ScopeAliasInterface.php
 *
 * @description
 * Column metadata for {@see \Stackra\Scope\Models\ScopeAlias} —
 * deployment-specific display renames of scope-definition slugs.
 * Lets a tenant rebrand "tenant" → "organisation" without touching
 * code. Each row is one (owner, slug) → label mapping.
 */

declare(strict_types=1);

namespace Stackra\Scope\Contracts\Data;

use Stackra\Scope\Models\ScopeAlias;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `scope_aliases` table.
 *
 * ## Uniqueness
 *
 * `(owner_id, scope_slug)` is unique — one alias per slug per
 * owner. Absent alias = definition's original label is used.
 *
 * ## DI wiring
 *
 * `#[Bind(ScopeAlias::class)]` lets attribute-first repositories
 * declare `#[UseModel(ScopeAliasInterface::class)]` and let the
 * container resolve the concrete model at construction time
 * (`.kiro/steering/php-attributes.md` § Stackra CRUD attributes).
 */
#[Bind(ScopeAlias::class)]
interface ScopeAliasInterface
{
    public const string TABLE = 'scope_aliases';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    /** UUID primary key. */
    public const string ATTR_ID = 'id';

    /** Owner id (usually tenant UUID). Cross-module FK by convention. */
    public const string ATTR_OWNER_ID = 'owner_id';

    /**
     * Scope-definition slug being aliased. References
     * `scope_definitions.slug` within the same owner.
     */
    public const string ATTR_SCOPE_SLUG = 'scope_slug';

    /**
     * Deployment-specific display label rendered by the admin UI.
     * Kept plain text (VARCHAR 255) — no HTML sanitisation happens
     * on read, so writes go through Spatie Data DTOs that enforce
     * a length + Unicode-only rule at the boundary.
     */
    public const string ATTR_ALIAS_LABEL = 'alias_label';

    /** Standard timestamps. */
    public const string ATTR_CREATED_AT = 'created_at';

    public const string ATTR_UPDATED_AT = 'updated_at';
}
