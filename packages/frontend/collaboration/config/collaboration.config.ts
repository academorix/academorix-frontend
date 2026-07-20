/**
 * @file collaboration.config.ts
 * @module @stackra/collaboration/config
 * @description Application-level collaboration transport configuration.
 *   Consumed by `CollaborationModule.forRoot()` at bootstrap.
 */

/**
 * Collaboration transport options.
 *
 *   - `'broadcast'` — same-origin cross-tab via `BroadcastChannel`.
 *     No server. Zero-setup default.
 *   - `'reverb'`    — Laravel Reverb / Pusher-compatible websocket
 *     transport via `@stackra/realtime`. Requires the realtime peer
 *     + a running Reverb (or Pusher-compatible) server.
 */
export const collaborationConfig = {
  /*
  |--------------------------------------------------------------------------
  | Transport
  |--------------------------------------------------------------------------
  |
  | Which transport CollaborationService uses to fan messages out to
  | other tabs / clients. `broadcast` is same-origin cross-tab only;
  | `reverb` requires @stackra/realtime + a running websocket server.
  |
  */
  transport: 'broadcast' as 'broadcast' | 'reverb',
};
