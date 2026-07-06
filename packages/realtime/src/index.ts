/**
 * @file index.ts
 * @module @academorix/realtime
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/realtime/client"} — `createRealtimeClient(config)`
 *    factory, `RealtimeClient` + `RealtimeChannel` + `RealtimeConfig` types.
 *  - {@link "@academorix/realtime/hooks"} — `useChannel`,
 *    `usePrivateChannel`, `usePresenceChannel`.
 *  - {@link "@academorix/realtime/refine"} — `createReverbLiveProvider`,
 *    `createNoopLiveProvider` (Refine `LiveProvider` adapters).
 *  - {@link "@academorix/realtime/context"} — `createRealtimeContext()`
 *    factory returning `{ RealtimeProvider, useRealtimeClient }`.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/lib/realtime.ts
 * import { createRealtimeClient } from "@academorix/realtime/client";
 * import { createRealtimeContext } from "@academorix/realtime/context";
 * import { envConfig } from "@/config/env.config";
 * import { tokenStore } from "@/lib/http";
 *
 * export const realtimeClient = createRealtimeClient({
 *   appKey: envConfig.reverb.appKey,
 *   host: envConfig.reverb.host,
 *   port: envConfig.reverb.port,
 *   scheme: envConfig.reverb.scheme,
 *   authEndpoint: `${envConfig.apiUrl}/broadcasting/auth`,
 *   getAuthHeaders: () => {
 *     const token = tokenStore.getToken();
 *     return token ? { Authorization: `Bearer ${token}` } : {};
 *   },
 * });
 *
 * export const { RealtimeProvider, useRealtimeClient } =
 *   createRealtimeContext();
 * ```
 */

export { createRealtimeClient } from "./client";
export type { RealtimeChannel, RealtimeClient, RealtimeConfig } from "./client";

export { createRealtimeContext } from "./context";
export type { RealtimeContextBundle, RealtimeProviderProps } from "./context";

export { useChannel, usePresenceChannel, usePrivateChannel } from "./hooks";
export type { ChannelHandlers, UsePresenceChannelOptions, UsePresenceChannelResult } from "./hooks";

export { createNoopLiveProvider, createReverbLiveProvider } from "./refine";
export type { LiveEvent, LiveEventType, LiveSubscribeArgs, RefineLiveProvider } from "./refine";
