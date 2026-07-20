/**
 * @file index.ts
 * @module @stackra/realtime/core/interfaces
 * @description Re-exports all interface definitions from this module.
 */
export type {
  IRealtimeConnection,
  IRealtimeChannel,
  IRealtimePresenceChannel,
} from "./realtime-connection.interface";
export type { IRealtimeConnector } from "./realtime-connector.interface";
export type {
  IRealtimeConnectionConfig,
  IRealtimeModuleOptions,
} from "./realtime-module-options.interface";
