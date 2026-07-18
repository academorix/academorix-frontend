<?php

/**
 * @file src/Contracts/Data/ScopeDefinitionInterface.php
 *
 * @description
 * Column + table metadata contract for {@see \Academorix\Scope\Models\ScopeDefinition}.
 * Ports the `academorix-api/tenancy` "constants-only interface" pattern
 * so every hard-coded column name lives in exactly one place. Column
 * renames become a single-file edit; every consumer references the
 * `ATTR_*` constants below.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts\Data;

/**
 * Table shape for the `scope_definitions` table — describes what
 * hierarchy levels EXIST per owner. Each row is one level in that
 * owner's tree (e.g. `global`, `owner`, `region`, `venue`).
 *
 * Constants-only: Eloquent uses magic `__get` / `__set`, so this
 * interface deliberately declares no methods. Hooking accessors
 * would force every model to override each column explicitly — a
 * heavier commitment than the column-rename ergonomics this contract
 * is chartered to deliver.
 */
interface ScopeDefinitionInterface
{
    /** Table name. */
    public const string TABLE = 'scope_definitions';

    /** Primary key column. UUIDs so nodes/values can FK to the definition. */
    public const string PRIMARY_KEY = 'id';

    /** Primary-key column type (matches Eloquent's `$keyType`). */
    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    /** UUID primary key. */
    public const string ATTR_ID = 'id';

    /**
     * Owner id — usually a Tenant UUID. Cross-module FK by
     * convention; scope deliberately does NOT know about tenancy.
     * The Tenancy module wires `owner_id = tenant->id` for tenant-
     * owned deployments.
     */
    public const string ATTR_OWNER_ID = 'owner_id';

    /**
     * URL-safe slug for this scope level. 1–64 chars, lowercase
     * alphanumeric + underscores. Unique per (owner_id, slug).
     */
    public const string ATTR_SLUG = 'slug';

    /** Human-readable display label. Overridable via ScopeAlias. */
    public const string ATTR_LABEL = 'label';

    /**
     * Parent slug within the same owner. `null` = root level. Level
     * hierarchy forms a strict tree; cycles are rejected at write
     * time by the registry validator.
     */
    public const string ATTR_PARENT_SLUG = 'parent_slug';

    /** Display order among siblings at the same parent level. */
    public const string ATTR_SORT_ORDER = 'sort_order';

    /** Standard timestamps. */
    public const string ATTR_CREATED_AT = 'created_at';

    public const string ATTR_UPDATED_AT = 'updated_at';

    public const string ATTR_DELETED_AT = 'deleted_at';
}
