/**
 * @file realtime-connector.interface.ts
 * @module @stackra/realtime/core/interfaces
 * @description Factory interface for creating realtime connections.
 */

import type { IRealtimeConnection } from "./realtime-connection.interface";
import type { IRealtimeConnectionConfig } from "./realtime-module-options.interface";

/**
 * Factory that creates a realtime connection from configuration.
 *
 * Each driver (socketio, pusher, ably, etc.) implements this.
 */
export interface IRealtimeConnector {
  /** Create and connect a new realtime connection. */
  connect(config: IRealtimeConnectionConfig): Promise<IRealtimeConnection>;
}
