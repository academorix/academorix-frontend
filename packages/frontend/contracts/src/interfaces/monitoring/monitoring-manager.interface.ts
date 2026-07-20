/**
 * @file monitoring-manager.interface.ts
 * @module @stackra/contracts/interfaces/monitoring
 * @description Public contract for the monitoring manager — the fan-out
 *   facade applications inject via `MONITORING_MANAGER`.
 */

import type {
  ICaptureContext,
  IMonitoringBreadcrumb,
  IMonitoringProvider,
  IMonitoringUser,
} from "./monitoring-provider.interface";

/**
 * Fan-out facade over every registered {@link IMonitoringProvider}.
 *
 * Inject via `@Inject(MONITORING_MANAGER)`. Each method dispatches to all
 * registered providers; a throwing provider never breaks the others.
 */
export interface IMonitoringManager {
  /** Report a caught exception to every provider. */
  captureException(error: Error, context?: ICaptureContext): void;

  /** Report a message-only event to every provider. */
  captureMessage(message: string, context?: ICaptureContext): void;

  /** Append a breadcrumb across every provider that supports it. */
  addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void;

  /** Bind (or clear) the current user across every provider. */
  setUser(user: IMonitoringUser | null): void;

  /** Flush buffered events across every provider. */
  flush(): Promise<void>;

  /** Register a provider at runtime. */
  register(provider: IMonitoringProvider): void;

  /** All registered providers. */
  getProviders(): readonly IMonitoringProvider[];
}
