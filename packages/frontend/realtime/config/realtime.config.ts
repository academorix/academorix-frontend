/**
 * @file realtime.config.ts
 * @module @stackra/realtime/config
 * @description Application-level realtime configuration.
 *   Consumed by `RealtimeModule.forRoot()` at bootstrap.
 */

import { defineConfig } from "@stackra/realtime";

export const realtimeConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Emit Lifecycle Events
  |--------------------------------------------------------------------------
  |
  | When true, the realtime system emits lifecycle events (connected,
  | disconnected, reconnecting, error) through the @stackra/events
  | EventEmitter for observability and monitoring.
  |
  */
  emitLifecycleEvents: true,

  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | This option controls the default realtime connection used when subscribing
  | to channels without specifying an explicit connection name.
  |
  */
  default: "main",

  /*
  |--------------------------------------------------------------------------
  | Realtime Connections
  |--------------------------------------------------------------------------
  |
  | Here you may configure each of the realtime connections used by your
  | application. Drivers are registered separately via forFeature().
  |
  | Supported drivers: "socketio", "pusher", "ably" (via plugins)
  |
  */
  connections: {
    main: {
      driver: "socketio",
      url: "ws://localhost:3001",
      autoConnect: true,
      namespace: "/",
      auth: {
        token: undefined,
        headers: {},
      },
      reconnection: {
        enabled: true,
        maxAttempts: Infinity,
        delay: 1000,
        maxDelay: 30000,
      },
    },
  },
});
