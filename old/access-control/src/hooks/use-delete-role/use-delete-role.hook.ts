/**
 * @file use-delete-role.hook.ts
 * @module @academorix/access-control/hooks/use-delete-role
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";

/**
 * Delete a role by id. System roles reject with `CannotModifySystemRole`.
 */
export function useDeleteRole(): UseMutationResult<void, Error, string> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => service.deleteRole(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["access-control", "roles", id] });
      void qc.invalidateQueries({ queryKey: ["access-control", "roles"] });
    },
  });
}
