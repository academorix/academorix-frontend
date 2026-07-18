/**
 * HttpManager.
 *
 * Multi-connection orchestrator. Mirrors the canonical
 * Redis/Queue/Realtime pattern:
 *
 * - extends `MultipleInstanceManager<IHttpClient>` for lazy
 *   resolution + caching;
 * - holds a connector registry populated by
 *   `HttpModule.forRoot()` (built-in axios) and
 *   `HttpModule.forFeature(driver, ConnectorClass)` (extensions);
 * - lazily builds an `HttpClient` per connection — each gets its
 *   own per-connection middleware + interceptor registries.
 *
 * Lifecycle:
 *
 * - `OnModuleInit` warms the default connection so config errors
 *   surface at boot.
 * - `OnModuleDestroy` purges every cached connection.
 *
 * @module @stackra/http/services/http-manager
 */

import {
  Inject,
  Injectable,
  Optional,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@stackra/container';
import { MultipleInstanceManager } from '@stackra/support';
import { Logger } from '@stackra/logger';

import {
  EVENT_EMITTER,
  HTTP_CONFIG,
  HTTP_EVENTS,
  type IEventEmitter,
  type IHttpClient,
  type IHttpClientConfig,
  type IHttpConnector,
  type IHttpInterceptorRegistry,
  type IHttpManager,
  type IHttpMiddlewareRegistry,
  type IHttpModuleOptions,
} from '@stackra/contracts';

import { HttpDriverError } from '../errors';
import { InterceptorRegistry, MiddlewareRegistry } from '../registries';

import { HttpClient } from './http-client.service';

/**
 * Concrete `IHttpManager` implementation.
 */
@Injectable()
export class HttpManager
  extends MultipleInstanceManager<IHttpClient>
  implements IHttpManager, OnModuleInit, OnModuleDestroy
{
  /** Scoped logger. */
  private readonly logger = new Logger(HttpManager.name);

  /** Connection name → middleware registry. */
  private readonly middlewareRegistries: Map<string, IHttpMiddlewareRegistry> = new Map();

  /** Connection name → interceptor registry. */
  private readonly interceptorRegistries: Map<string, IHttpInterceptorRegistry> = new Map();

  /**
   * @param config       - Module options.
   * @param eventEmitter - Optional emitter for lifecycle events.
   */
  public constructor(
    @Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {
    super();
  }

  // ────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async onModuleInit(): Promise<void> {
    if (!this.config?.default) {
      this.logger.warn('[HttpManager] config.default is missing — skipping warm-up.');
      return;
    }

    if (!this.config.connections[this.config.default]) {
      this.logger.warn(
        `[HttpManager] default connection "${this.config.default}" is not declared.`
      );
      return;
    }

    // Lazy warm-up: if the driver isn't registered yet (e.g., forFeature
    // hasn't been processed), skip. The connection will be created on first use.
    try {
      await this.connection();
    } catch (err: Error | any) {
      this.logger.debug(
        `[HttpManager] deferred default connection warm-up: ${(err as Error).message}`
      );
    }
  }

  /** @inheritdoc */
  public async onModuleDestroy(): Promise<void> {
    this.purge();
    this.middlewareRegistries.clear();
    this.interceptorRegistries.clear();
  }

  // ────────────────────────────────────────────────────────────────────
  // MultipleInstanceManager contract
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public override getDefaultInstance(): string {
    return this.config.default;
  }

  /** @inheritdoc */
  public override setDefaultInstance(name: string): void {
    if (!this.config.connections[name]) {
      throw new HttpDriverError(
        `[HttpManager] cannot set default to "${name}" — not declared in connections.`
      );
    }
    (this.config as { default: string }).default = name;
  }

  /** Mirror `setDefaultInstance` under the contract name. */
  public setDefaultConnectionName(name: string): void {
    this.setDefaultInstance(name);
  }

  /** @inheritdoc */
  public override getInstanceConfig(name: string): Record<string, unknown> | null {
    const raw = this.config.connections[name];
    if (!raw) return null;
    return {
      ...(raw as unknown as Record<string, unknown>),
      driver: raw.driver ?? 'axios',
      __connectionName: name,
    };
  }

  /**
   * Build an `HttpClient` from a connector and connection config.
   *
   * Used by `extend()` factories registered in `HttpModule.forRoot()`
   * and `HttpModule.forFeature()` to construct the full client with
   * per-connection middleware and interceptor registries.
   *
   * @param connector - The HTTP connector (transport driver).
   * @param config    - Raw connection config from `getInstanceConfig()`.
   * @returns A fully wired `IHttpClient`.
   */
  public createClientFromConnector(
    connector: IHttpConnector,
    config: Record<string, unknown>
  ): IHttpClient {
    const connectionName = (config['__connectionName'] as string | undefined) ?? 'default';
    const clientConfig = { ...config } as Record<string, unknown>;
    delete clientConfig['__connectionName'];

    const middlewareRegistry =
      this.middlewareRegistries.get(connectionName) ?? new MiddlewareRegistry();
    this.middlewareRegistries.set(connectionName, middlewareRegistry);

    const interceptorRegistry =
      this.interceptorRegistries.get(connectionName) ?? new InterceptorRegistry();
    this.interceptorRegistries.set(connectionName, interceptorRegistry);

    const client = new HttpClient({
      name: connectionName,
      config: clientConfig as unknown as IHttpClientConfig,
      connector,
      middlewareRegistry,
      interceptorRegistry,
      ...(this.eventEmitter !== undefined ? { eventEmitter: this.eventEmitter } : {}),
    });

    this.emit(HTTP_EVENTS.CONNECTION_CREATED, {
      connection: connectionName,
      driver: (config['driver'] as string | undefined) ?? 'unknown',
      baseURL: (clientConfig['baseURL'] as string | undefined) ?? null,
    });

    return client;
  }

  // ────────────────────────────────────────────────────────────────────
  // Public surface
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public async connection(name?: string): Promise<IHttpClient> {
    return this.instanceAsync(name);
  }

  /** @inheritdoc */
  public forgetConnection(name?: string | string[]): void {
    super.forgetInstance(name);
    if (name === undefined) {
      this.middlewareRegistries.clear();
      this.interceptorRegistries.clear();
      return;
    }

    const targets = Array.isArray(name) ? name : [name];
    for (const target of targets) {
      this.middlewareRegistries.delete(target);
      this.interceptorRegistries.delete(target);
      this.emit(HTTP_EVENTS.CONNECTION_DISPOSED, { connection: target });
    }
  }

  /** @inheritdoc */
  public override purge(): void {
    super.purge();
    this.middlewareRegistries.clear();
    this.interceptorRegistries.clear();
  }

  /** @inheritdoc */
  public addConnection(name: string, config: IHttpClientConfig): boolean {
    if (this.config.connections[name]) {
      this.logger.info(
        `[HttpManager] connection "${name}" already configured — keeping existing entry.`
      );
      return false;
    }
    this.config.connections[name] = config;
    return true;
  }

  /** @inheritdoc */
  public async getMiddlewareRegistry(name?: string): Promise<IHttpMiddlewareRegistry> {
    const connectionName = name ?? this.config.default;
    if (!this.middlewareRegistries.has(connectionName)) {
      // Force connection resolution so the registry is created.
      await this.connection(connectionName);
    }
    const registry = this.middlewareRegistries.get(connectionName);
    if (!registry) {
      throw new HttpDriverError(
        `[HttpManager] middleware registry for "${connectionName}" is unavailable.`
      );
    }
    return registry;
  }

  /** @inheritdoc */
  public async getInterceptorRegistry(name?: string): Promise<IHttpInterceptorRegistry> {
    const connectionName = name ?? this.config.default;
    if (!this.interceptorRegistries.has(connectionName)) {
      await this.connection(connectionName);
    }
    const registry = this.interceptorRegistries.get(connectionName);
    if (!registry) {
      throw new HttpDriverError(
        `[HttpManager] interceptor registry for "${connectionName}" is unavailable.`
      );
    }
    return registry;
  }

  /** @inheritdoc */
  public getConnectionNames(): string[] {
    return Object.keys(this.config.connections);
  }

  /** @inheritdoc */
  public getDefaultConnectionName(): string {
    return this.config.default;
  }

  /** @inheritdoc */
  public isConnectionActive(name?: string): boolean {
    return this.hasInstance(name ?? this.config.default);
  }

  /** @inheritdoc */
  public getActiveConnectionNames(): string[] {
    return this.getResolvedInstances();
  }

  // ────────────────────────────────────────────────────────────────────
  // Private — events
  // ────────────────────────────────────────────────────────────────────

  /** Best-effort lifecycle event emission. */
  private emit(event: string, payload: unknown): void {
    if (!this.eventEmitter) return;
    try {
      this.eventEmitter.emit(event, payload);
    } catch (err: Error | any) {
      this.logger.warn(`[HttpManager] event emission failed for "${event}"`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
