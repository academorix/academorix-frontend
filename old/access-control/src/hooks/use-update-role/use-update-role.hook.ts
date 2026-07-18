/**
 * @file use-update-role.hook.ts
 * @module @academorix/access-control/hooks/use-update-role
 * @description React Query mutation for `updateRole()`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { UpdateRoleInputSchema } from "../../schemas/update-role-input.schema";
import type { IRoleData } from "@academorix/contracts";

export interface IUpdateRoleVariables {
  readonly id: string;
  readonly input: UpdateRoleInputSchema;
}

/**
 * Update an existing role. Invalidates both the specific record
 * and the list on success.
 */
export function useUpdateRole(): UseMutationResult<IRoleData, Error, IUpdateRoleVariables> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => service.updateRole(id, input),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["access-control", "roles", id] });
      void qc.invalidateQueries({ queryKey: ["access-control", "roles"] });
    },
  });
}
