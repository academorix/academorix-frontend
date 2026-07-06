/**
 * @file index.ts
 * @module @academorix/realtime/hooks
 *
 * @description
 * Public barrel for the React realtime hooks.
 */

export { useChannel, usePrivateChannel } from "./use-channel";
export type { ChannelHandlers } from "./use-channel";

export { usePresenceChannel } from "./use-presence-channel";
export type { UsePresenceChannelOptions, UsePresenceChannelResult } from "./use-presence-channel";
