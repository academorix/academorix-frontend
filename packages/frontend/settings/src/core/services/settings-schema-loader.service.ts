/**
 * @file settings-schema-loader.service.ts
 * @module @stackra/settings/core/services
 * @description Fetches the remote settings schema on module init
 *   when `config.api.autoLoadSchema === true`, and registers every
 *   returned group with the `SettingsRegistry`.
 *
 *   The fetch is fail-soft — a network error only logs a warning
 *   through the optional `LOGGER_MANAGER`. Client-declared DTOs
 *   registered through `SettingsModule.forFeature` continue to work
 *   independently.
 */

import { Injectable, Inject, Optional, OnModuleInit } from "@stackra/container";
import { retry, Uri } from "@stackra/support";
import {
  HTTP_MANAGER,
  LOGGER_MANAGER,
  SETTINGS_CONFIG,
  SETTINGS_EVENTS,
  SETTINGS_REGISTRY,
  SETTINGS_SERVICE,
  EVENT_EMITTER,
  type IEventEmitter,
  type IHttpManager,
  type ILoggerManager,
  type ISettingsConfig,
  type ISettingsRegistry,
  type ISettingsService,
} from "@stackra/contracts";

import { parseSchemaPayload } from "@/core/utils/parse-schema.util";

/**
 * Loads the settings schema from the backend at boot when opted in.
 *
 * Two-tier fetch:
 * 1. Optional local cache — when
 *    `config.api.cacheSchemaStore !== false`, the last-known schema
 *    is persisted via `STORAGE_MANAGER` and rehydrated first for a
 *    warm cold-start. (Wiring for this hook is planned; the initial
 *    release fetches the network directly to keep the surface
 *    small.)
 * 2. Network fetch through the configured HTTP client.
 *
 * The loader registers definitions into the registry and emits
 * `SETTINGS_EVENTS.SCHEMA_LOADED` on the event bus. If registration
 * fails for a specific group, the error is captured and the batch
 * continues so a single malformed group cannot break the boot.
 */
@Injectable()
export class SettingsSchemaLoader implements OnModuleInit {
  public constructor(
    @Inject(SETTINGS_CONFIG) private readonly config: ISettingsConfig,
    @Inject(SETTINGS_REGISTRY) private readonly registry: ISettingsRegistry,
    @Optional() @Inject(SETTINGS_SERVICE) private readonly service?: ISettingsService,
    @Optional() @Inject(HTTP_MANAGER) private readonly httpManager?: IHttpManager,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  /**
   * Boot-time hook. Fetches the schema when the caller has opted in.
   * All work is guarded — a missing HTTP peer or a network failure
   * degrades gracefully to "no remote schema loaded".
   */
  public async onModuleInit(): Promise<void> {
    if (!this.config.api.autoLoadSchema) return;
    if (!this.httpManager) {
      this.warn("autoLoadSchema is enabled but @stackra/http is not installed.");
      return;
    }
    await this.loadSchema();
  }

  /**
   * Manually load (or reload) the remote schema.
   *
   * Exposed publicly so apps can invoke it on demand — e.g., after
   * an admin publishes a new group and the client wants to refresh
   * without a page reload.
   */
  public async loadSchema(): Promise<void> {
    if (!this.httpManager) return;

    try {
      const client = await this.httpManager.connection(this.config.api.httpClient);
      const url = this.buildSchemaUrl();
      const payload = await retry(async () => {
        const res = await client.get<unknown>(url);
        return res.data;
      });

      const definitions = parseSchemaPayload(payload);
      this.registry.registerManyFromSchema(definitions);

      this.emit(SETTINGS_EVENTS.SCHEMA_LOADED, { count: definitions.length });

      // Bulk-hydrate every group in one round trip when the caller
      // opts in. Runs after schema registration so `hydrateAll`
      // has definitions to write into. Fail-soft — the schema is
      // still loaded even if values hydration fails.
      if (this.config.api.autoLoadValues && this.service) {
        try {
          await this.service.loadAll();
        } catch (error) {
          this.warn("Failed to bulk-hydrate settings values.", error);
        }
      }
    } catch (error) {
      this.warn("Failed to load remote settings schema.", error);
    }
  }

  /** Build the absolute schema URL from config. */
  private buildSchemaUrl(): string {
    const path = this.config.api.endpoints.schema;
    if (!this.config.api.baseUrl) return path;
    return Uri.of(this.config.api.baseUrl).path(path).toString();
  }

  /** Emit an event through the optional bus. Fail-soft. */
  private emit(event: string, payload: unknown): void {
    if (!this.events) return;
    void this.events.emit(event, payload).catch(() => {
      /* fail-soft */
    });
  }

  /** Warn via the optional logger. Fail-soft. */
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
