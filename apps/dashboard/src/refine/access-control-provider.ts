/**
 * @file access-control-provider.ts
 * @module refine/access-control-provider
 *
 * @description
 * Stub access-control provider. Grants access if the caller holds `"*"`
 * (superuser) or the resource's exact permission. The rule ships open by
 * default (empty permissions = allow) so the demo flows without a backend.
 */

import type { AccessControlProvider } from "@refinedev/core";

import { appResources } from "@/modules/registry";

/** Look up the permission a resource + action requires. */
function requiredFor(resourceName: string): string | undefined {
  return appResources.find((r) => r.name === resourceName)?.meta.requiredPermission;
}

/**
 * We don't have identity plumbing yet (the auth provider is a stub), so we
 * grant everything. When the real identity lands, read `useGetIdentity()` and
 * check `identity.permissions.includes("*") || identity.permissions.includes(perm)`.
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource }) => {
    const permission = resource ? requiredFor(resource) : undefined;

    // No permission declared → allow. Real auth: check identity.permissions.
    if (!permission) return { can: true };

    return { can: true };
  },
  options: {
    buttons: { enableAccessControl: true, hideIfUnauthorized: true },
  },
};
