/**
 * @file use-revoke-role.hook.ts
 * @module @academorix/access-control/hooks/use-revoke-role
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";

export interface IRevokeRoleVariables {
  readonly userId: string;
  readonly roleId: string;
}

/**
 * Revoke a role from a user.
 */
export function useRevokeRole(): UseMutationResult<void, Error, IRevokeRoleVariables> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }) => service.revokeRole(userId, roleId),
    onSuccess: (_data, { userId }) => {
      void qc.invalidateQueries({ queryKey: ["access-control", "users", userId, "roles"] });
    },
  });
}
