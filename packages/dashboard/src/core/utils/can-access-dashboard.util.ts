/**
 * @file can-access-dashboard.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Decide whether a viewer may see a dashboard in-app.
 *
 *   Rules mirror the storage model:
 *
 *   1. **Owner override** — the owner always sees their own
 *      dashboards regardless of `shareLevel`. Built-in dashboards
 *      have a synthetic owner id.
 *   2. `shareLevel === "private"` — only the owner passes.
 *   3. `shareLevel === "shared"` — every tenant member passes.
 *   4. `shareLevel === "role-restricted"` — the viewer must match
 *      any grant. `everyone` grants match unconditionally.
 *   5. **Admin escape hatch** — a viewer whose role list contains
 *      `"admin"` sees every dashboard.
 *
 *   The function is intentionally pure: no I/O, no side effects. The
 *   caller passes the current grant snapshot and viewer identity.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { IDashboardAccessSubject } from "@/core/interfaces/dashboard-access-subject.interface";
import type { IDashboardShareGrant } from "@/core/interfaces/dashboard-share-grant.interface";

/**
 * Decide whether the given viewer may see the dashboard in-app.
 *
 * @param dashboard - Dashboard whose access is being decided.
 * @param grants - Snapshot of every persisted grant. Grants that
 *   don't reference the dashboard are ignored, so callers can pass
 *   the entire tenant-wide list without pre-filtering.
 * @param currentUser - Viewer descriptor.
 * @returns `true` when the viewer may see the dashboard in-app.
 */
export function canAccessDashboard(
  dashboard: IDashboard,
  grants: readonly IDashboardShareGrant[],
  currentUser: IDashboardAccessSubject,
): boolean {
  // Rule 1 — the owner always sees their own dashboards. Built-in
  // dashboards synthesise the playground owner id so they inherit
  // this rule instead of needing a special case.
  if (dashboard.ownerId === currentUser.id) {
    return true;
  }

  // Rule 5 — admins bypass every access rule. Applied before the
  // shareLevel switch so admins never trip over an incomplete grant
  // list on a restricted dashboard.
  if (currentUser.roles.includes("admin")) {
    return true;
  }

  switch (dashboard.shareLevel) {
    case "private":
      // Only owner + admins may see private dashboards. Both already
      // returned true above; anyone else is out.
      return false;

    case "shared":
      // Every tenant member sees shared dashboards.
      return true;

    case "role-restricted": {
      // Filter to grants for this dashboard so the caller can pass
      // the tenant-wide list without pre-filtering.
      const applicable = grants.filter((entry) => entry.dashboardId === dashboard.id);

      return applicable.some((grant) => {
        switch (grant.targetType) {
          case "everyone":
            return true;

          case "role":
            return currentUser.roles.includes(grant.targetId);

          case "user":
            return currentUser.id === grant.targetId;
        }
      });
    }
  }
}
