/**
 * @file base.ts
 * @module types/base
 *
 * @description
 * Shared building blocks every domain model composes: the common persisted
 * columns and the tenant-scoping marker. These mirror the backend's base model
 * and `BelongsToTenant` trait (see `IDENTITY_AND_TENANCY_SPEC.md` §2).
 *
 * ## Conventions (apply to every model in `@/types`)
 * - **snake_case** field names — identical to the JSON the Laravel API emits, so
 *   the JSON-file mock and the REST API are byte-for-byte interchangeable.
 * - **ISO-8601 string** timestamps (never `Date`) — JSON has no date type.
 * - **UUID string** primary/foreign keys — the backend uses UUIDs.
 */

/**
 * Columns present on every persisted record. Domain models extend this so
 * list/table code can rely on `id`, `created_at`, and `updated_at` existing.
 */
export interface BaseModel {
  /** UUID primary key. */
  id: string;
  /** ISO-8601 creation timestamp. */
  created_at: string;
  /** ISO-8601 last-update timestamp. */
  updated_at: string;
}

/**
 * Marker for a record that belongs to a tenant. Almost every domain model is
 * tenant-scoped (row-level multi-tenancy via `tenant_id`). `tenant_id` is set by
 * the tenancy layer, never by request input — a hard security boundary.
 */
export interface TenantScoped {
  /** Owning tenant's UUID. */
  tenant_id: string;
}

/**
 * Attribute-hosting marker for records that carry sport-/tenant-variable fields.
 * The dynamic values live in a single `attributes` object (mirrors the backend
 * `JSONB` column populated via `spatie/laravel-schemaless-attributes`); typed
 * base columns stay on the model itself.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §6 "Do we need attributes?"
 */
export interface AttributeHost {
  /** Dynamic, set-defined attribute values keyed by attribute code. */
  attributes: Record<string, unknown>;
}
