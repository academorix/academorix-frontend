/**
 * @file realtime-manager.service.ts
 * @module @stackra/realtime/core/services
 * @description Multi-driver realtime manager — resolves named connections.
 *   Transport-agnostic. Drivers registered via `forFeature()`.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import { Manager } from "@stackra/support";
import {
  EVENT_EMITTER,
  REALTIME_CONFIG,
  REALTIME_EVENTS,
  type IEventEmitter,
  type IRealtimeConnection,
  type IRealtimeManager,
} from "@stackra/contracts";
import { RealtimeConnectionError } from "@/core/errors";
import type { IRealtimeModuleOptions } from "@/core/interfaces";

/**
 * Realtime manager — resolves named WebSocket connections.
 *
 * No built-in drivers — drivers are registered via `RealtimeModule.forFeature()`.
 * This keeps the root entry transport-agnostic (no Socket.IO in the bundle
 * unless explicitly opted in).
 *
 * @example
 * ```typescript
 * const manager = container.get<RealtimeManager>(REALTIME_MANAGER);
 * const conn = await manager.connection();
 * const channel = conn.channel('orders');
 * channel.on('updated', (data) => logger.info(data));
 * ```
 */
@Injectable()
export class RealtimeManager extends Manager<IRealtimeConnection> implements IRealtimeManager {
  /** Scoped logger for fail-soft emit warnings. */
  private readonly logger = new Logger(RealtimeManager.name);

  /** Resolved async connections cache. */
  private readonly asyncConnections = new Map<string, IRealtimeConnection>();

  /**
   * @param config - Realtime module configuration
   * @param eventEmitter - Optional event emitter for lifecycle events
   */
  public constructor(
    @Inject(REALTIME_CONFIG) private readonly config: IRealtimeModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
  ) {
    super();
  }

  /**
   * Get the default driver name.
   *
   * @returns The configured default connection name
   */
  public getDefaultDriver(): string {
    return this.config.default;
  }

  /**
   * Resolve a named connection (async — connectors need handshake).
   *
   * @param name - Connection name (defaults to configured default)
   * @returns The resolved realtime connection
   */
  public async connection(name?: string): Promise<IRealtimeConnection> {
    const connectionName = name ?? this.config.default;
    const cached = this.asyncConnections.get(connectionName);
    if (cached) return cached;

    throw new RealtimeConnectionError(
      `Realtime driver for "${connectionName}" is not registered. ` +
        `Use RealtimeModule.forFeature(driver, ConnectorClass) to register.`,
    );
  }

  /**
   * Register a resolved connection (called by forFeature providers).
   *
   * @param name - Connection name
   * @param connection - The connected instance
   */
  public registerConnection(name: string, connection: IRealtimeConnection): void {
    this.asyncConnections.set(name, connection);
    this.emit(REALTIME_EVENTS.CONNECTED, { connection: name });
  }

  /**
   * Disconnect a specific connection.
   *
   * @param name - Connection name
   */
  public async disconnect(name?: string): Promise<void> {
    const connectionName = name ?? this.config.default;
    const conn = this.asyncConnections.get(connectionName);
    if (conn) {
      conn.disconnect();
      this.asyncConnections.delete(connectionName);
      this.emit(REALTIME_EVENTS.DISCONNECTED, {
        connection: connectionName,
        reason: "manual",
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Driver-facing publish helpers
  // ══════════════════════════════════════════════════════════════════════════
  //
  // Drivers (Socket.IO, Pusher, custom transports) call these helpers to
  // publish transport-level events on the shared bus. Keeping the emit
  // surface here (instead of asking each driver to inject EVENT_EMITTER
  // itself) guarantees:
  //   - Consistent event names across every driver.
  //   - Fail-soft behaviour for free (drivers can't accidentally break
  //     a subscriber's emit).
  //   - One place to add hooks (metrics, logging, tests).

  /**
   * Signal that a driver is attempting to reconnect.
   *
   * Called by drivers when their transport-level reconnect logic
   * kicks in. Fires `REALTIME_EVENTS.RECONNECTING` on the shared
   * bus so dashboards can surface flaky connections.
   *
   * @param connection - Connection name.
   * @param attempt    - 1-based attempt counter (surface to UI).
   */
  public reportReconnecting(connection: string, attempt: number): void {
    this.emit(REALTIME_EVENTS.RECONNECTING, { connection, attempt });
  }

  /**
   * Signal that the underlying transport surfaced an error.
   *
   * Drivers call this on socket-level errors that don't drop the
   * connection (recoverable transport hiccups). Hard disconnects
   * should call {@link disconnect} instead so DISCONNECTED fires
   * with the correct reason.
   *
   * @param connection - Connection name.
   * @param error      - Error instance or serialisable descriptor.
   */
  public reportError(connection: string, error: unknown): void {
    this.emit(REALTIME_EVENTS.ERROR, {
      connection,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  /**
   * Signal that a message arrived on a subscribed channel.
   *
   * Called by drivers after the raw frame has been decoded. Fires
   * `REALTIME_EVENTS.MESSAGE` on the shared bus so cross-package
   * listeners (analytics, audit) can see every inbound frame
   * without knowing which channel it came from.
   *
   * @param connection - Connection name that received the frame.
   * @param channel    - Channel the frame was routed on.
   * @param event      - Event name inside the frame.
   * @param data       - Decoded payload.
   */
  public reportMessage(connection: string, channel: string, event: string, data: unknown): void {
    this.emit(REALTIME_EVENTS.MESSAGE, { connection, channel, event, data });
  }

  /**
   * Emit a realtime lifecycle event on the optional event bus.
   *
   * Fail-soft: silently no-ops when no emitter is registered and
   * swallows synchronous errors thrown by listeners so a misbehaving
   * subscriber can never break a connection operation.
   *
   * @param event - Event name (from `REALTIME_EVENTS`).
   * @param payload - Event payload.
   */
  private emit(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      void this.eventEmitter.emit(event, payload);
    } catch (error: unknown) {
      this.logger.warn("[RealtimeManager] failed to emit event", { event, error });
    }
  }

  /**
   * Disconnect all connections.
   */
  public async disconnectAll(): Promise<void> {
    for (const [name] of this.asyncConnections) {
      await this.disconnect(name);
    }
  }

  /**
   * Get all configured connection names.
   *
   * @returns Array of connection name strings
   */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }
}
