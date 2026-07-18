/**
 * @file use-permissions.hook.ts
 * @module @academorix/access-control/hooks/use-permissions
 * @description React Query wrapper around `listPermissions()`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { IPermissionData } from "@academorix/contracts";

/**
 * List every permission the backend exposes.
 *
 * @returns React Query result carrying the permission list.
 */
export function usePermissions(): UseQueryResult<readonly IPermissionData[]> {
  const service = useInject(ACCESS_CONTROL_SERVICE);

  return useQuery({
    queryKey: ["access-control", "permissions"],
    queryFn: () => service.listPermissions(),
  });
}
