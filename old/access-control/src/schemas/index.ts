/**
 * @file index.ts
 * @module @academorix/access-control/schemas
 * @description Barrel exposing every Zod input schema.
 */

export {
  createPermissionInputSchema,
  type CreatePermissionInputSchema,
} from "./create-permission-input.schema";
export {
  updatePermissionInputSchema,
  type UpdatePermissionInputSchema,
} from "./update-permission-input.schema";
export { createRoleInputSchema, type CreateRoleInputSchema } from "./create-role-input.schema";
export { updateRoleInputSchema, type UpdateRoleInputSchema } from "./update-role-input.schema";
export { assignRoleInputSchema, type AssignRoleInputSchema } from "./assign-role-input.schema";
export {
  syncRolePermissionsInputSchema,
  type SyncRolePermissionsInputSchema,
} from "./sync-role-permissions-input.schema";
