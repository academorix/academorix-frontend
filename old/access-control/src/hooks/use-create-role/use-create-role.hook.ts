/**
 * @file use-create-role.hook.ts
 * @module @academorix/access-control/hooks/use-create-role
 * @description React Query mutation for `createRole()`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { CreateRoleInputSchema } from "../../schemas/create-role-input.schema";
import type { IRoleData } from "@academorix/contracts";

/**
 * Create a role. Invalidates the roles list on success.
 */
export function useCreateRole(): UseMutationResult<IRoleData, Error, CreateRoleInputSchema> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => service.createRole(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["access-control", "roles"] }),
  });
}
