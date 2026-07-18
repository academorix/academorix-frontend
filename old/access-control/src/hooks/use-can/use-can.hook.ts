/**
 * @file use-can.hook.ts
 * @module @academorix/access-control/hooks/use-can
 *
 * @description
 * Server-side ability check via React Query. Consumer components
 * prefer `useHasPermission` / `useHasRole` for static checks
 * knowable from the boot payload; this hook fires when the
 * `params` payload requires server-side policy evaluation
 * (per-record ownership, plan-gate context, etc.).
 */

"use client";

import { useInject } from "@academorix/container/react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ACCESS_CONTROL_SERVICE } from "@academorix/contracts";
import type { ICanRequest, ICanResponse } from "@academorix/contracts";

/**
 * Server-side ability check.
 *
 * @param request - Action + optional resource + optional params.
 * @param enabled - When false, the query is disabled (useful for
 *   conditional checks — pass `enabled: user != null`).
 * @returns React Query result carrying `{ can, reason? }`.
 */
export function useCan(
  request: ICanRequest,
  enabled: boolean = true,
): UseQueryResult<ICanResponse> {
  const service = useInject(ACCESS_CONTROL_SERVICE);

  return useQuery({
    queryKey: ["access-control", "can", request],
    queryFn: () => service.can(request),
    enabled,
  });
}
