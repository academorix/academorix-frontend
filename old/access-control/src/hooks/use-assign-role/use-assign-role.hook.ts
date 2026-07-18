/**
 * @file use-assign-role.hook.ts
 * @module @academorix/access-control/hooks/use-assign-role
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { AssignRoleInputSchema } from "../../schemas/assign-role-input.schema";
import type { IRoleAssignmentData } from "@academorix/contracts";

export interface IAssignRoleVariables {
  readonly userId: string;
  readonly input: AssignRoleInputSchema;
}

/**
 * Assign a role to a user. Invalidates user-role lookups.
 */
export function useAssignRole(): UseMutationResult<
  IRoleAssignmentData,
  Error,
  IAssignRoleVariables
> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }) => service.assignRole(userId, input),
    onSuccess: (_data, { userId }) => {
      void qc.invalidateQueries({ queryKey: ["access-control", "users", userId, "roles"] });
    },
  });
}
