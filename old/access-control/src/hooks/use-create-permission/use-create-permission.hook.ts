/**
 * @file use-create-permission.hook.ts
 * @module @academorix/access-control/hooks/use-create-permission
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { CreatePermissionInputSchema } from "../../schemas/create-permission-input.schema";
import type { IPermissionData } from "@academorix/contracts";

/**
 * Create a permission. Invalidates the permission list.
 */
export function useCreatePermission(): UseMutationResult<
  IPermissionData,
  Error,
  CreatePermissionInputSchema
> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => service.createPermission(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["access-control", "permissions"] }),
  });
}
