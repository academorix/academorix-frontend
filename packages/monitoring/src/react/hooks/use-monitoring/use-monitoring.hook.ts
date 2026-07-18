/**
 * @file use-monitoring.hook.ts
 * @module @stackra/monitoring/react/hooks
 * @description Resolve the MonitoringManager from the DI container.
 */

import { useInject } from '@stackra/container/react';
import { MONITORING_MANAGER } from '@stackra/contracts';
import type { IMonitoringManager } from '@stackra/contracts';

/**
 * Resolve the {@link IMonitoringManager} from the surrounding
 * `ContainerProvider`.
 *
 * @returns The monitoring manager.
 *
 * @example
 * ```tsx
 * const monitoring = useMonitoring();
 * <AppErrorBoundary onError={(e, i) => monitoring.captureException(e, { componentStack: i.componentStack })}>
 * ```
 */
export function useMonitoring(): IMonitoringManager {
  return useInject<IMonitoringManager>(MONITORING_MANAGER);
}
