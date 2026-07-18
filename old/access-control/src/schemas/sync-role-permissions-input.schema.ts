/**
 * @file sync-role-permissions-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Inputs\SyncRolePermissionsData`.
 */

import { z } from "zod";

/**
 * Zod schema for the role↔permissions sync endpoint body.
 * `permissions` is an array of permission NAMES (not ids) — the
 * backend translates via `PermissionRegistry`.
 */
export const syncRolePermissionsInputSchema = z.object({
  permissions: z
    .array(z.string().min(1))
    .min(0, "permissions must be an array (empty array clears the role)"),
});

export type SyncRolePermissionsInputSchema = z.infer<typeof syncRolePermissionsInputSchema>;
