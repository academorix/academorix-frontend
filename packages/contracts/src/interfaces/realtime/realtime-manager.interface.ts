/**
 * @file realtime-manager.interface.ts
 * @module @stackra/contracts/interfaces/realtime
 * @description The `IRealtimeManager` contract — resolves named
 *   realtime connections lazily.
 *
 *   This shape is the **consumer** surface: what other packages
 *   inject via `@Inject(REALTIME_MANAGER)`. Driver-facing helpers
 *   (`registerConnection`, `reportError`, `reportMessage`) stay on
 *   the concrete `RealtimeManager` class in `@stackra/realtime` —
 *   they're an implementation detail of the driver-loader plumbing.
 */

import type { IRealtimeConnection } from "./realtime-connection.interface";

/**
 * Multi-connection realtime manager.
 *
 * Mirrors the shape `@stackra/cache` / `@stackra/http` /
 * `@stackra/storage` expose: named instances resolved on demand,
 * cached after first resolve. The connection is async because
 * drivers typically need a handshake (auth, transport upgrade)
 * before returning a usable handle.
 *
 * @example
 * ```typescript
 * import { REALTIME_MANAGER, type IRealtimeManager } from '@stackra/contracts';
 *
 * class SettingsBroadcastListener {
 *   public constructor(
 *     @Inject(REALTIME_MANAGER) private readonly realtime: IRealtimeManager,
 *   ) {}
 *
 *   async subscribe(): Promise<void> {
 *     const connection = await this.realtime.connection();
 *     connection.channel('settings.theme').on('settings.changed', handler);
 *   }
 * }
 * ```
 */
export interface IRealtimeManager {
  /**
   * Resolve (and cache) a named connection.
   *
   * @param name - Connection name. Defaults to the configured default.
   * @returns A live `IRealtimeConnection`.
   * @throws When no driver has been registered for the requested name.
   */
  connection(name?: string): Promise<IRealtimeConnection>;

  /**
   * Close a specific connection. Idempotent — safe to call on an
   * already-closed connection.
   *
   * @param name - Connection name. Defaults to the configured default.
   */
  disconnect(name?: string): Promise<void>;

  /** Close every currently-open connection. */
  disconnectAll(): Promise<void>;

  /** Every connection name declared in module config. */
  getConnectionNames(): string[];

  /** The default connection name (used when `connection()` is called with no argument). */
  getDefaultDriver(): string;
}
