/**
 * @file assign-role-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Inputs\AssignRoleData`.
 */

import { z } from "zod";

/**
 * Zod schema for the user-role assignment endpoint body.
 * `roleId` is required — the URL carries `userId`.
 */
export const assignRoleInputSchema = z.object({
  roleId: z.string().min(1, "roleId is required"),
});

export type AssignRoleInputSchema = z.infer<typeof assignRoleInputSchema>;
