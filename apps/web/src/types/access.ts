/**
 * @file access.ts
 * @module types/access
 *
 * @description
 * RBAC shapes: roles, permissions, and scoped grants. Authorization itself is
 * enforced from the identity's flat `permissions[]`; these types back the Access
 * module's admin screens (viewing roles and where they're granted).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.7 "Access (RBAC)"
 */

import type { BaseModel, TenantScoped } from "@/types/base";

/**
 * A permission the platform can check, e.g. `"athletes.viewAny"`. Permissions
 * follow the `resource.ability` convention the access-control provider maps
 * Refine actions onto.
 */
export interface Permission extends BaseModel {
  /** Dotted permission key, e.g. `"athletes.create"`. */
  name: string;
  /** Human-readable description for the admin UI. */
  description: string | null;
  /** Resource this permission belongs to (for grouping). */
  resource: string;
}

/**
 * A per-tenant role: a named bundle of permissions. Roles are **data** seeded
 * per business type (owner/admin/branch_manager/coach/…), never a fixed
 * frontend union.
 */
export interface Role extends BaseModel, TenantScoped {
  name: string;
  description: string | null;
  /** Permission keys this role grants. */
  permissions: string[];
  /** Whether this is a system role that cannot be deleted. */
  is_system: boolean;
}

/**
 * A permission grant scoped to part of the hierarchy, with an optional expiry —
 * e.g. "coach of Marina branch only, until season end".
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §3 "Scoped grants"
 */
export interface ScopedGrant extends BaseModel, TenantScoped {
  /** The user the grant applies to. */
  user_id: string;
  /** The role granted. */
  role_id: string;
  /** Organization the grant is limited to, or `null` for tenant-wide. */
  organization_id: string | null;
  /** Branch the grant is limited to, or `null`. */
  branch_id: string | null;
  /** Team the grant is limited to, or `null`. */
  team_id: string | null;
  /** ISO-8601 expiry, or `null` for a permanent grant. */
  expires_at: string | null;
}
