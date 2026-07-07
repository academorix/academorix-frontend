/**
 * @file admin-surfaces.config.ts
 * @module modules/admin/admin-surfaces.config
 *
 * @description
 * The registry of Admin Console surface cards. Every card the hub shows is
 * declared here — the internal `/admin/*` pages this module owns and the
 * external module links (Users, Staff, Roles, Feature flags, Subscription,
 * Usage, Audit log). Kept in one place so:
 *
 *  1. Adding a new surface is a single-file change — declare it here and the
 *     grid picks it up automatically.
 *  2. Permission gating is uniform — the hub filters this list against the
 *     caller's permission set (see {@link filterSurfacesByPermissions}).
 *  3. Unit tests can assert on the pure config without dragging in the shell.
 *
 * The list is wrapped in `defineConfig<T>()` from `@academorix/core/config` so
 * IDE go-to-definition lands on this file rather than the passthrough helper.
 */

import {
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  FlagIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@academorix/ui/icons/outline";
import { defineConfig } from "@academorix/core/config";

import type { AdminSurface, AdminSurfaceGroup, AdminSurfaceId } from "@/modules/admin/admin.types";

/**
 * The tuple of `(surface, group)` entries the registry produces. Kept as a
 * tuple instead of a flat surface list so the grouping stays declarative and
 * a single test can prove every surface belongs to a group.
 */
interface AdminSurfaceEntry {
  surface: AdminSurface;
  group: AdminSurfaceGroup;
}

/**
 * The registered admin surfaces, in canonical display order. Order matters
 * inside a group — the hub renders each group in `ADMIN_SURFACE_GROUP_ORDER`
 * (see `admin.types.ts`) and, within a group, the order in this array.
 */
export const adminSurfaces = defineConfig<readonly AdminSurfaceEntry[]>([
  // ─────────────────────────── Workspace ──────────────────────────────
  {
    group: "workspace",
    surface: {
      id: "settings",
      title: "General settings",
      description: "Workspace name, timezone, default locale, and terminology overrides.",
      icon: BuildingOfficeIcon,
      path: "/admin/settings",
      // The admin module's own umbrella permission — everyone who can reach
      // the console can reach its owned pages.
      requiredPermission: "admin.view",
      isExternal: false,
    },
  },
  {
    group: "workspace",
    surface: {
      id: "branding",
      title: "Branding",
      description: "Logo, favicon, brand colours, and custom fonts.",
      icon: PaintBrushIcon,
      path: "/admin/branding",
      requiredPermission: "admin.view",
      isExternal: false,
    },
  },
  {
    group: "workspace",
    surface: {
      id: "integrations",
      title: "Integrations",
      description: "Connect Stripe, Slack, Google Workspace, and other providers.",
      icon: PuzzlePieceIcon,
      path: "/admin/integrations",
      requiredPermission: "admin.view",
      isExternal: false,
    },
  },

  // ─────────────────────── People and access ──────────────────────────
  {
    group: "people",
    surface: {
      id: "users",
      title: "Users",
      description: "Tenant staff and admin accounts, statuses, and role assignments.",
      icon: UsersIcon,
      // Links to the existing Users module. Kept as `/users` (not `/admin/users`)
      // so a deep link from anywhere in the shell still resolves.
      path: "/users",
      requiredPermission: "users.viewAny",
      isExternal: true,
    },
  },
  {
    group: "people",
    surface: {
      id: "staff",
      title: "Staff",
      description: "Coaches, admins, reception, medical — employment and status.",
      icon: UsersIcon,
      path: "/staff",
      requiredPermission: "staff.viewAny",
      isExternal: true,
    },
  },
  {
    group: "people",
    surface: {
      id: "roles",
      title: "Roles and access",
      description: "Tenant roles and the permissions each one grants.",
      icon: ShieldCheckIcon,
      path: "/roles",
      requiredPermission: "roles.viewAny",
      isExternal: true,
    },
  },

  // ─────────────────────────── Platform ───────────────────────────────
  {
    group: "platform",
    surface: {
      id: "feature-flags",
      title: "Feature flags",
      description: "Per-tenant toggles and per-branch overrides.",
      icon: FlagIcon,
      // The Settings module registers `/settings/feature-flags` as a routed
      // section (currently a placeholder). Once its editor lands the card
      // works end-to-end without a change here.
      path: "/settings/feature-flags",
      requiredPermission: "admin.view",
      isExternal: true,
    },
  },
  {
    group: "platform",
    surface: {
      id: "subscription",
      title: "Subscription",
      description: "Plan, seats, invoices, and payment method.",
      icon: CreditCardIcon,
      path: "/settings/billing",
      requiredPermission: "view_billing",
      isExternal: true,
    },
  },
  {
    group: "platform",
    surface: {
      id: "usage",
      title: "Usage and limits",
      description: "The full entitlement matrix — slots, pools, and features.",
      icon: ChartPieIcon,
      path: "/usage",
      requiredPermission: "view_billing",
      isExternal: true,
    },
  },

  // ────────────────────────── Compliance ──────────────────────────────
  {
    group: "compliance",
    surface: {
      id: "audit-logs",
      title: "Audit log",
      description: "Every privileged action on the workspace, with actor and target.",
      icon: ClipboardDocumentListIcon,
      // Frontend route not registered yet — the card renders "Coming soon"
      // so operators know the surface is on the roadmap.
      // TODO(backend-endpoint): wire to `/audit-logs` once the frontend module
      // ships. Backend already exposes `/api/v1/audits` (see modules/Audit).
      path: "/audit-logs",
      requiredPermission: "admin.view",
      isExternal: true,
      isComingSoon: true,
    },
  },
]);

/**
 * Lookup table for direct id resolution. Built once at module load so the hub
 * and tests do not need to filter the array every time they need one surface.
 */
export const adminSurfacesById: ReadonlyMap<AdminSurfaceId, AdminSurface> = new Map(
  adminSurfaces.map((entry) => [entry.surface.id, entry.surface]),
);

// Silence "unused" hints for icons we reserve for future compliance cards
// (data retention, GDPR requests). Wiring is expected in a follow-up.
void BuildingLibraryIcon;

/**
 * Whether the caller (identified by the given permission set) may see and
 * interact with a surface. Mirrors the access-control provider:
 * a `"*"` in the caller's permissions grants everything; otherwise the
 * surface's `requiredPermission` must be present in the set.
 *
 * @param surface - The surface to test.
 * @param permissions - The caller's effective permission strings.
 * @returns `true` when the surface should appear on the hub.
 */
export function canSeeSurface(surface: AdminSurface, permissions: readonly string[]): boolean {
  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(surface.requiredPermission);
}

/**
 * Filters {@link adminSurfaces} down to the entries visible to the given
 * permission set, preserving the source order. Grouping is intentionally left
 * to the caller — the hub does the group-by pass so it can render section
 * headers and empty-group states independently.
 *
 * @param permissions - The caller's effective permission strings.
 * @returns The visible surface entries, in source order.
 */
export function filterSurfacesByPermissions(
  permissions: readonly string[],
): readonly AdminSurfaceEntry[] {
  return adminSurfaces.filter((entry) => canSeeSurface(entry.surface, permissions));
}

/**
 * Groups the visible surfaces by their {@link AdminSurfaceGroup}, returning
 * an object keyed by group id. Empty groups are omitted so the hub does not
 * render bare section headers.
 *
 * @param permissions - The caller's effective permission strings.
 * @returns A record of group id → surface list.
 */
export function groupVisibleSurfaces(
  permissions: readonly string[],
): Partial<Record<AdminSurfaceGroup, AdminSurface[]>> {
  const visible = filterSurfacesByPermissions(permissions);
  const grouped: Partial<Record<AdminSurfaceGroup, AdminSurface[]>> = {};

  for (const entry of visible) {
    const bucket = grouped[entry.group] ?? [];

    bucket.push(entry.surface);
    grouped[entry.group] = bucket;
  }

  return grouped;
}
