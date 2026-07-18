/**
 * @file use-current-dashboard.interface.ts
 * @module @stackra/dashboard/react/hooks/use-current-dashboard
 * @description Public return shape for {@link useCurrentDashboard}.
 */

import type { IDashboard } from "@/core/interfaces/dashboard.interface";

import type { IUseDashboardsResult } from "../use-dashboards/use-dashboards.interface";

/**
 * Return shape for {@link useCurrentDashboard}.
 */
export interface IUseCurrentDashboardResult {
  /** Every dashboard the user can currently see. */
  dashboards: readonly IDashboard[];

  /** The resolved current dashboard, or `null` while loading. */
  current: IDashboard | null;

  /** True until the first list read completes. */
  isLoading: boolean;

  /** True when a mutation is currently in flight. */
  isMutating: boolean;

  /** Any error thrown by the last operation. */
  error: Error | null;

  /** Registry mutators forwarded verbatim from {@link useDashboards}. */
  registry: IUseDashboardsResult;
}
