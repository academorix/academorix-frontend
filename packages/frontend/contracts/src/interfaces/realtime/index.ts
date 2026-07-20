/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/realtime
 * @description Barrel for the realtime contracts.
 *
 *   Consumers inject the manager via `REALTIME_MANAGER` and open a
 *   connection, which returns channels for pub/sub. Drivers
 *   (Socket.IO, Pusher, Ably) implement the connection + channel
 *   shapes; the manager sits above them.
 */

export type { IRealtimeChannel, IRealtimePresenceChannel } from "./realtime-channel.interface";
export type { IRealtimeConnection } from "./realtime-connection.interface";
export type { IRealtimeManager } from "./realtime-manager.interface";
