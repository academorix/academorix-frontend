/**
 * @file index.ts
 * @module notifications/realtime
 *
 * @description
 * Barrel for the notifications module's realtime adapter. Currently
 * exposes a single symbol — the {@link echoRealtimeClient} — which
 * projects the dashboard's existing Echo singleton onto the
 * `RealtimeClient` interface from `@academorix/realtime` so the
 * module's hooks can call `useChannel(client, name, handlers)`
 * without spinning up a second WebSocket.
 */

export { echoRealtimeClient } from "./echo-realtime-client";
