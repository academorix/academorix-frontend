/**
 * @file use-realtime.hook.ts
 * @module @stackra/realtime/react
 * @description React hook for accessing the RealtimeManager from DI.
 */

import { useInject } from "@stackra/container/react";
import { REALTIME_MANAGER } from "@stackra/contracts";
import { RealtimeManager } from "@/core/services/realtime-manager.service";

/**
 * Access the RealtimeManager for advanced operations.
 *
 * @returns The RealtimeManager instance
 *
 * @example
 * ```typescript
 * function ConnectionStatus() {
 *   const manager = useRealtime();
 *   return <span>{manager.getConnectionNames().join(', ')}</span>;
 * }
 * ```
 */
export function useRealtime(): RealtimeManager {
  return useInject<RealtimeManager>(REALTIME_MANAGER);
}
