/**
 * @file use-update-permission.hook.ts
 * @module @academorix/access-control/hooks/use-update-permission
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { UpdatePermissionInputSchema } from "../../schemas/update-permission-input.schema";
import type { IPermissionData } from "@academorix/contracts";

/**
 * Variables carried by the update-permission mutation.
 */
export interface IUpdatePermissionVariables {
  readonly id: string;
  readonly input: UpdatePermissionInputSchema;
}

/**
 * Update a permission. Invalidates the specific record + list.
 */
export function useUpdatePermission(): UseMutationResult<
  IPermissionData,
  Error,
  IUpdatePermissionVariables
> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => service.updatePermission(id, input),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["access-control", "permissions", id] });
      void qc.invalidateQueries({ queryKey: ["access-control", "permissions"] });
    },
  });
}
