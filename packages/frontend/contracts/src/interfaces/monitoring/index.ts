/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/monitoring
 * @description Barrel for error-monitoring contracts.
 */

export type {
  MonitoringSeverity,
  IMonitoringUser,
  IMonitoringBreadcrumb,
  ICaptureContext,
  IMonitoringProvider,
} from "./monitoring-provider.interface";
export type { IMonitoringManager } from "./monitoring-manager.interface";
