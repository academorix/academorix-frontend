/**
 * @file settings-broadcast-listener.service.ts
 * @module @stackra/settings/core/services
 * @description Subscribes to realtime `settings.changed` broadcasts
 *   and merges incoming values into the local cache.
 *
 *   Opt-in via `config.broadcasting.enabled === true`. Requires the
 *   optional `@stackra/realtime` peer.
 *
 *   Runs at `onApplicationBootstrap` so every module has finished
 *   `onModuleInit` (including the schema loader) before we start
 *   subscribing to channels per registered group.
 */

import { Injectable, Inject, Optional, OnApplicationBootstrap } from "@stackra/container";
import {
  LOGGER_MANAGER,
  REALTIME_MANAGER,
  SETTINGS_CONFIG,
  SETTINGS_REGISTRY,
  SETTINGS_SERVICE,
  type ILoggerManager,
  type IRealtimeConnection,
  type IRealtimeManager,
  type ISettingDefinition,
  type ISettingsConfig,
  type ISettingsRegistry,
  type ISettingsService,
} from "@stackra/contracts";

/**
 * Shape of the payload the Laravel backend broadcasts under the
 * `settings.changed` event name on the wire.
 */
interface IBroadcastPayload {
  readonly group: string;
  readonly changed_fields?: readonly string[];
  readonly values?: Record<string, unknown>;
  readonly timestamp?: number;
}

/**
 * Bridges the realtime broadcast bus to the local settings service.
 */
@Injectable()
export class SettingsBroadcastListener implements OnApplicationBootstrap {
  public constructor(
    @Inject(SETTINGS_CONFIG) private readonly config: ISettingsConfig,
    @Inject(SETTINGS_REGISTRY) private readonly registry: ISettingsRegistry,
    @Inject(SETTINGS_SERVICE) private readonly service: ISettingsService,
    @Optional() @Inject(REALTIME_MANAGER) private readonly realtime?: IRealtimeManager,
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  /**
   * Late boot hook — every other module has settled by now so the
   * registry is fully populated with the DTO-registered groups and
   * (if enabled) the schema-loader's groups.
   */
  public async onApplicationBootstrap(): Promise<void> {
    if (!this.config.broadcasting.enabled) return;

    if (!this.realtime) {
      this.warn("broadcasting.enabled is true but @stackra/realtime is not installed.");
      return;
    }

    try {
      const connection = await this.realtime.connection(this.config.broadcasting.connection);
      for (const definition of this.registry.all()) {
        this.subscribeToGroup(connection, definition);
      }
    } catch (error) {
      this.warn("Failed to open realtime connection for settings.", error);
    }
  }

  /**
   * Subscribe to the appropriate channel for one group.
   *
   * Public groups broadcast on `{prefix}.{group}` (public channel);
   * non-public groups broadcast on the same name but require auth
   * (private channel).
   */
  private subscribeToGroup(connection: IRealtimeConnection, definition: ISettingDefinition): void {
    try {
      const name = `${this.config.broadcasting.channelPrefix}.${definition.key}`;
      const channel = definition.public
        ? connection.channel(name)
        : connection.privateChannel(name);

      channel.on("settings.changed", (data) => this.handleBroadcast(data));
    } catch (error) {
      this.warn(`Failed to subscribe to broadcast for group "${definition.key}".`, error);
    }
  }

  /**
   * Coerce the incoming payload into the shape the service expects
   * and merge it into the local cache.
   */
  private handleBroadcast(data: unknown): void {
    if (!isBroadcastPayload(data)) return;
    if (!this.registry.has(data.group)) return;
    if (!data.values) return;
    this.service.hydrateValues(data.group, data.values);
  }

  /** Warn via the optional logger. */
  private warn(message: string, cause?: unknown): void {
    if (!this.logger) return;
    try {
      const suffix = cause ? `: ${String(cause)}` : "";
      this.logger.create("settings").warn(`${message}${suffix}`);
    } catch {
      /* fail-soft */
    }
  }
}

/** Runtime shape guard for the incoming realtime payload. */
function isBroadcastPayload(value: unknown): value is IBroadcastPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "group" in value &&
    typeof (value as { group?: unknown }).group === "string"
  );
}
