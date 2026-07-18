/**
 * @file use-role.hook.ts
 * @module @academorix/access-control/hooks/use-role
 * @description React Query wrapper around `showRole(id)`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { IRoleData } from "@academorix/contracts";

/** Fetch a single role by id. */
export function useRole(id: string): UseQueryResult<IRoleData> {
  const service = useInject(ACCESS_CONTROL_SERVICE);
  return useQuery({
    queryKey: ["access-control", "roles", id],
    queryFn: () => service.showRole(id),
    enabled: id.length > 0,
  });
}
