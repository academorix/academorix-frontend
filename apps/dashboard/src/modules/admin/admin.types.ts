/**
 * @file admin.types.ts
 * @module modules/admin/admin.types
 *
 * @description
 * Module-local shapes for the **Admin Console** — a hub of tenant-wide
 * administration surfaces (users, roles, feature flags, subscription,
 * audit log, integrations, plus the tenant settings and branding pages the
 * module owns itself).
 *
 * The Admin Console is a *directory*, not a resource: each surface card links
 * to another module's list page, to one of this module's own pages, or to a
 * placeholder for a surface whose backend/frontend has not shipped yet.
 * Keeping the descriptors module-local (rather than in `@/types`) keeps the
 * hub free to evolve without cascading through the shared type layer.
 */

import type { IconType } from "@academorix/ui/icons";

/**
 * The stable, kebab-case identifier for an admin surface. Used as a `Map` key
 * for lookups, as the React `key` for a rendered card, and — for future work —
 * as the analytics event id when a card is opened.
 */
export type AdminSurfaceId =
  | "settings"
  | "branding"
  | "integrations"
  | "users"
  | "staff"
  | "roles"
  | "feature-flags"
  | "subscription"
  | "usage"
  | "audit-logs";

/**
 * A single card on the Admin Console hub. Each surface describes what the
 * card looks like (icon, title, description) and where clicking "Open" takes
 * the operator (an internal `/admin/*` route or an external `/users` /
 * `/roles` / `/settings/billing` module list page).
 */
export interface AdminSurface {
  /** Stable identifier — see {@link AdminSurfaceId}. */
  id: AdminSurfaceId;
  /** Short card title, e.g. `"General settings"`. */
  title: string;
  /**
   * One-line description explaining what the surface owns. Kept concise so the
   * grid of cards reads at a glance rather than as a wall of prose.
   */
  description: string;
  /** Icon glyph rendered on the card. */
  icon: IconType;
  /** Absolute path to navigate to when the card is opened. */
  path: string;
  /**
   * The permission the caller must hold to see and use the card. Cards whose
   * permission is missing are filtered out of the rendered grid (and the
   * "Coming soon" ones remain visible but non-actionable).
   *
   * A `"*"` in the caller's permission set grants everything, matching the
   * access-control provider's superuser convention.
   */
  requiredPermission: string;
  /**
   * `true` when the surface points to an external module (e.g. Users, Staff,
   * Roles) rather than a page owned by the Admin module. Drives copy on the
   * card so operators know they are leaving the console.
   */
  isExternal: boolean;
  /**
   * `true` when the surface is registered but not yet functional (backend or
   * frontend still pending). The card still renders — so operators can
   * discover it — but the primary action is a disabled "Coming soon" button
   * instead of "Open".
   */
  isComingSoon?: boolean;
}

/** The category buckets used to group cards on the hub. */
export type AdminSurfaceGroup = "workspace" | "people" | "platform" | "compliance";

/** Human-readable label for each {@link AdminSurfaceGroup}. */
export const ADMIN_SURFACE_GROUP_LABELS: Record<AdminSurfaceGroup, string> = {
  workspace: "Workspace",
  people: "People and access",
  platform: "Platform",
  compliance: "Compliance",
};

/**
 * Canonical grouping order — matches how the hub renders its sections top to
 * bottom (workspace configuration first, then people/access, then platform-
 * level integrations and billing, then compliance surfaces last).
 */
export const ADMIN_SURFACE_GROUP_ORDER: readonly AdminSurfaceGroup[] = [
  "workspace",
  "people",
  "platform",
  "compliance",
];

/**
 * The values a caller supplies to {@link TerminologyEditor}. Each key is the
 * canonical resource name; each value is the tenant's preferred noun. Values
 * are stored as-typed and only trimmed on save.
 *
 * Keeping this local (rather than reusing `Identity["terminology"]`) makes
 * the shape independent of the auth payload — if `/auth/me` ever carries
 * more than just resource-name overrides, the editor stays untouched.
 */
export type TerminologyDraft = Record<string, string>;
