/**
 * @file use-permission.hook.ts
 * @module @academorix/access-control/hooks/use-permission
 * @description React Query wrapper around `showPermission(id)`.
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { IPermissionData } from "@academorix/contracts";

/**
 * Fetch a single permission by id.
 *
 * @param id - Permission ULID.
 */
export function usePermission(id: string): UseQueryResult<IPermissionData> {
  const service = useInject(ACCESS_CONTROL_SERVICE);

  return useQuery({
    queryKey: ["access-control", "permissions", id],
    queryFn: () => service.showPermission(id),
    enabled: id.length > 0,
  });
}
