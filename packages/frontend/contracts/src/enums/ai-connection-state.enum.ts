/**
 * @file ai-connection-state.enum.ts
 * @module @stackra/contracts/enums
 * @description Observable state of the active AI transport connection.
 */

/** State of the active AI transport connection. */
export enum AiConnectionState {
  /** Establishing a connection. */
  Connecting = "connecting",
  /** Connected and ready. */
  Connected = "connected",
  /** Disconnected (may reconnect). */
  Disconnected = "disconnected",
  /** In an error state. */
  Error = "error",
  /** Offline (no network). */
  Offline = "offline",
}
