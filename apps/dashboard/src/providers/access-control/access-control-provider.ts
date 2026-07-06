/**
 * @file access-control-provider.ts
 * @module providers/access-control/access-control-provider
 *
 * @description
 * Refine `AccessControlProvider` that gates UI actions on the current user's
 * permissions (read from the shared {@link session} cache, which the auth
 * provider populates).
 *
 * It maps Refine's CRUD actions to backend-style permission strings
 * (`"<resource>.<ability>"`) matching the `spatie/laravel-permission` grants
 * described in the tenancy spec, so `<CanAccess>` and `useCan()` line up with
 * server-side policies once those land.
 *
 * ## Day-1 posture
 * - **Superusers** (a `"*"` wildcard permission, held by owner/admin) can do
 *   everything.
 * - When permissions have not loaded yet (bootstrap), it **fails open** so the
 *   authenticated shell is never briefly blank. Production hardening would flip
 *   this to fail-closed once the permission set is guaranteed present.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §8 (Authorization detail)
 */

import type { AccessControlProvider, CanParams, CanReturnType } from "@refinedev/core";

import { getCurrentPermissions, hasPermission } from "@/providers/auth/session";

/**
 * Maps a Refine action to the ability segment of a permission string.
 * `"<resource>.<ability>"`, e.g. `students.viewAny`, `courses.update`.
 */
const ACTION_ABILITY: Record<string, string> = {
  list: "viewAny",
  show: "view",
  create: "create",
  edit: "update",
  clone: "create",
  delete: "delete",
};

/** Grant helper — always allowed. */
const ALLOW: CanReturnType = { can: true };

/**
 * Access-control provider. Kept synchronous in spirit (permissions are cached
 * in memory) but returns a Promise to satisfy Refine's async `can` contract.
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }: CanParams): Promise<CanReturnType> => {
    const permissions = getCurrentPermissions();

    // Bootstrap / unknown → fail open (see file docblock).
    if (permissions.length === 0) {
      return ALLOW;
    }

    // Superuser wildcard.
    if (permissions.includes("*")) {
      return ALLOW;
    }

    // Actions without a resource (e.g. custom UI gates) are allowed by default.
    if (!resource) {
      return ALLOW;
    }

    const ability = ACTION_ABILITY[action] ?? action;
    const permission = `${resource}.${ability}`;

    if (hasPermission(permission)) {
      return ALLOW;
    }

    return { can: false, reason: `You do not have the "${permission}" permission.` };
  },
  options: {
    buttons: {
      // Render action buttons in a disabled state rather than hiding them, so
      // the UI is discoverable and users understand what they lack access to.
      enableAccessControl: true,
      hideIfUnauthorized: false,
    },
  },
};
