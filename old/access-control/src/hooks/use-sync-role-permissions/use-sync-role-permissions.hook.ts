/**
 * @file use-sync-role-permissions.hook.ts
 * @module @academorix/access-control/hooks/use-sync-role-permissions
 * @description Replace a role's permission set with a new list.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { SyncRolePermissionsInputSchema } from "../../schemas/sync-role-permissions-input.schema";
import type { IRoleData } from "@academorix/contracts";

export interface ISyncRolePermissionsVariables {
  readonly roleId: string;
  readonly input: SyncRolePermissionsInputSchema;
}

/**
 * Sync a role's permission set. Invalidates the role detail + list.
 */
export function useSyncRolePermissions(): UseMutationResult<
  IRoleData,
  Error,
  ISyncRolePermissionsVariables
> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, input }) => service.syncRolePermissions(roleId, input),
    onSuccess: (_data, { roleId }) => {
      void qc.invalidateQueries({ queryKey: ["access-control", "roles", roleId] });
      void qc.invalidateQueries({ queryKey: ["access-control", "roles"] });
    },
  });
}
