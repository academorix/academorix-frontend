/**
 * @file index.ts
 * @module @academorix/realtime/client
 *
 * @description
 * Public barrel for the Reverb/Echo-backed realtime client factory
 * and its typed interfaces.
 */

export { createRealtimeClient } from "./create-realtime-client";
export type { RealtimeChannel, RealtimeClient } from "./realtime-client.type";
export type { RealtimeConfig } from "./realtime-config.type";
