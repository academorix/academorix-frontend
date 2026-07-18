/**
 * @file use-roles.hook.ts
 * @module @academorix/access-control/hooks/use-roles
 * @description React Query wrapper around `listRoles()`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { IRoleData } from "@academorix/contracts";

/** List every role. */
export function useRoles(): UseQueryResult<readonly IRoleData[]> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  return useQuery({
    queryKey: ["access-control", "roles"],
    queryFn: () => service.listRoles(),
  });
}
