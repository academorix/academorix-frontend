/**
 * @file scope-definition.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description A single level in a tenant's dynamic scope hierarchy.
 */

/**
 * Scope definition — a single level in the tenant's scope hierarchy.
 *
 * Definitions are dynamic per tenant. Different tenants can have
 * completely different hierarchy structures (e.g. `global → tenant →
 * region → venue` vs. `global → tenant → academy → team`).
 */
export interface IScopeDefinition {
  /** Unique identifier. */
  id: string;

  /** Tenant this definition belongs to. */
  owner_id: string;

  /** URL-safe identifier (1-64 chars, lowercase alphanumeric + underscores). */
  slug: string;

  /** Human-readable display name. */
  label: string;

  /** Parent scope definition slug (`null` = root level). */
  parent_slug: string | null;

  /** Display ordering among siblings at the same level. */
  sort_order: number;

  /** Creation timestamp. */
  created_at: Date;

  /** Last update timestamp. */
  updated_at: Date;

  /** Soft-delete timestamp (`null` if active). */
  deleted_at: Date | null;
}
