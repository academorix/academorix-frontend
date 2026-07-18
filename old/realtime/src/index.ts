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

// ---------------------------------------------------------------------------
// RealtimeProvider — temporary passthrough shim.
//
// The barrel used to export a top-level `<RealtimeProvider>`; that surface
// has been retired in favour of the `createRealtimeContext()` factory shown
// above. `apps/dashboard/src/App.tsx` still imports the old name, so we
// keep a no-op passthrough here to unblock the dashboard boot. Downstream
// features that need a live client should call `createRealtimeContext()`
// at app scope, export the returned `RealtimeProvider`, and swap this
// import for the local one. Delete this shim once every consumer migrates.
// ---------------------------------------------------------------------------
import type { ReactNode } from "react";

/** Props for the {@link RealtimeProvider} shim (children only). */
export interface RealtimeProviderProps_Legacy {
  children: ReactNode;
}

/**
 * Passthrough shim — renders `children` unchanged. See the comment above
 * for the migration path to the factory API.
 */
export function RealtimeProvider({ children }: RealtimeProviderProps_Legacy) {
  return children;
}

export { useChannel, usePresenceChannel, usePrivateChannel } from "./hooks";
export type { ChannelHandlers, UsePresenceChannelOptions, UsePresenceChannelResult } from "./hooks";

export { createNoopLiveProvider, createReverbLiveProvider } from "./refine";
export type { LiveEvent, LiveEventType, LiveSubscribeArgs, RefineLiveProvider } from "./refine";
