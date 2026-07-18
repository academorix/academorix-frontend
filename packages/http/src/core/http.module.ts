/**
 * HTTP module.
 *
 * Wires the manager + axios connector + per-connection middleware /
 * interceptors / pipelines into the DI container. Three entry
 * points:
 *
 * - `forRoot(options)`             — static configuration. Registers
 *   built-in middleware (auth, rate-limit, circuit-breaker, dedup,
 *   progress) and built-in interceptors (error-normalizer, retry,
 *   cache, transform, metrics, logging) on every connection.
 * - `forRootAsync(options)`        — DI-driven async configuration.
 * - `forFeature(driver, Class)`    — register a custom connector.
 * - `forFeatureMiddleware(...)`    — register additional connections
 *   and / or per-connection middleware / interceptors.
 *
 * Mirrors `RedisModule` / `QueueModule` / `RealtimeModule` exactly.
 *
 * @module @stackra/http/http.module
 */

import {
  Global,
  Inject,
  Injectable,
  Module,
  ModuleRef,
  type DynamicModule,
  type OnApplicationBootstrap,
  type Type,
} from '@stackra/container';
import { Logger } from '@stackra/logger';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';

import {
  DEFAULT_HTTP_CONNECTION_TOKEN,
  HTTP_CLIENT,
  HTTP_CONFIG,
  HTTP_MANAGER,
  getHttpConnectionToken,
  type IHttpClient,
  type IHttpConnector,
  type IHttpInterceptor,
  type IHttpManager,
  type IHttpMiddleware,
  type IHttpModuleAsyncOptions,
  type IHttpModuleFeatureOptions,
  type IHttpModuleOptions,
} from '@stackra/contracts';

import { AxiosConnector } from './connectors/axios.connector';
import { getHttpInterceptorMetadata, getHttpMiddlewareMetadata } from './decorators';
import { HttpModuleOptionsError } from './errors';
import {
  CacheInterceptor,
  ErrorNormalizerInterceptor,
  LoggingInterceptor,
  MetricsInterceptor,
  RetryInterceptor,
  TransformInterceptor,
} from './interceptors';
import {
  AuthMiddleware,
  CircuitBreakerMiddleware,
  DeduplicationMiddleware,
  ProgressMiddleware,
  RateLimitMiddleware,
} from './middleware';
import {
  CircuitBreakerService,
  HttpManager,
  MetricsCollectorService,
  TokenBucketService,
  UploadService,
} from './services';

/**
 * Built-in connector registration entry.
 */
interface IBuiltInConnector {
  /** Driver name. */
  driver: string;
  /** Connector class instantiated via DI. */
  type: Type<IHttpConnector>;
}

/**
 * Built-in connectors registered automatically by `forRoot()`.
 */
const BUILT_IN_CONNECTORS: ReadonlyArray<IBuiltInConnector> = Object.freeze([
  { driver: 'axios', type: AxiosConnector },
]);

/**
 * Built-in middleware classes registered against every connection.
 *
 * The order doesn't matter — each class carries its priority via
 * the `@HttpMiddleware()` decorator.
 */
const BUILT_IN_MIDDLEWARE: ReadonlyArray<Type<IHttpMiddleware>> = Object.freeze([
  AuthMiddleware,
  RateLimitMiddleware,
  CircuitBreakerMiddleware,
  DeduplicationMiddleware,
  ProgressMiddleware,
]);

/**
 * Built-in interceptor classes registered against every connection.
 */
const BUILT_IN_INTERCEPTORS: ReadonlyArray<Type<IHttpInterceptor>> = Object.freeze([
  ErrorNormalizerInterceptor,
  RetryInterceptor,
  CacheInterceptor,
  TransformInterceptor,
  MetricsInterceptor,
  LoggingInterceptor,
]);

/**
 * HTTP DI module.
 */
@Global()
@Module({})
export class HttpModule {
  /** Scoped logger. */
  private static readonly logger = new Logger(HttpModule.name);

  // ────────────────────────────────────────────────────────────────────
  // forRoot
  // ────────────────────────────────────────────────────────────────────

  /**
   * Configure the HTTP module statically.
   *
   * @param config - Module options.
   * @returns A dynamic module wiring every provider.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     HttpModule.forRoot({
   *       default: 'api',
   *       connections: {
   *         api:    { baseURL: 'https://api.example.com', timeout: 10_000 },
   *         auth:   { baseURL: 'https://auth.example.com', timeout: 5_000 },
   *       },
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  public static forRoot(config: IHttpModuleOptions): DynamicModule {
    HttpModule.validate(config);

    const connectorRegistrations = HttpModule.buildConnectorRegistrations();
    const middlewareRegistrations = HttpModule.buildMiddlewareRegistrations(config);
    const interceptorRegistrations = HttpModule.buildInterceptorRegistrations(config);

    const connectionTokens = Object.keys(config.connections).map(getHttpConnectionToken);
    const connectionProviders = Object.keys(config.connections).map((connectionName) => ({
      provide: getHttpConnectionToken(connectionName),
      useFactory: async (manager: HttpManager) => manager.connection(connectionName),
      inject: [HttpManager],
    }));

    return {
      module: HttpModule,
      global: true,
      providers: [
        // Config
        { provide: HTTP_CONFIG, useValue: config },

        // Manager
        HttpManager,
        { provide: HTTP_MANAGER, useExisting: HttpManager },

        // Support services
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,

        // Built-in connectors
        ...connectorRegistrations.providers,

        // Built-in middleware
        ...middlewareRegistrations.providers,

        // Built-in interceptors
        ...interceptorRegistrations.providers,

        // Per-connection providers
        ...connectionProviders,
        {
          provide: DEFAULT_HTTP_CONNECTION_TOKEN,
          useFactory: async (manager: HttpManager) => manager.connection(),
          inject: [HttpManager],
        },
        {
          provide: HTTP_CLIENT,
          useFactory: async (manager: HttpManager) => manager.connection(),
          inject: [HttpManager],
        },
      ],
      exports: [
        HTTP_CONFIG,
        HttpManager,
        HTTP_MANAGER,
        HTTP_CLIENT,
        DEFAULT_HTTP_CONNECTION_TOKEN,
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,
        ...connectionTokens,
      ],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // forRootAsync
  // ────────────────────────────────────────────────────────────────────

  /**
   * Configure the HTTP module asynchronously.
   *
   * Built-in connectors / middleware / interceptors are still
   * registered automatically — only the config object is async.
   * Per-connection tokens are NOT pre-bound (the connection list is
   * unknown at module-build time); use `manager.connection(name)`.
   *
   * @param options - Async options.
   */
  public static forRootAsync(options: IHttpModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) {
      HttpModule.logger.warn('[HttpModule] forRootAsync requires useFactory.');
      return { module: HttpModule, providers: [], exports: [] };
    }

    const connectorRegistrations = HttpModule.buildConnectorRegistrations();

    return {
      module: HttpModule,
      global: true,
      imports: (options.imports ?? []) as never[],
      providers: [
        {
          provide: HTTP_CONFIG,
          useFactory: options.useFactory,
          inject: (options.inject ?? []) as never[],
        },

        HttpManager,
        { provide: HTTP_MANAGER, useExisting: HttpManager },

        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,

        ...connectorRegistrations.providers,

        // Built-in middleware/interceptors are still registered as
        // providers so feature modules can pull them through DI when
        // needed.
        ...BUILT_IN_MIDDLEWARE,
        ...BUILT_IN_INTERCEPTORS,
      ],
      exports: [
        HTTP_CONFIG,
        HttpManager,
        HTTP_MANAGER,
        TokenBucketService,
        CircuitBreakerService,
        MetricsCollectorService,
        UploadService,
      ],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // forFeature — additional driver
  // ────────────────────────────────────────────────────────────────────

  /**
   * Register feature-scoped HTTP wiring: a custom driver and/or extra
   * connections and/or per-connection middleware / interceptors.
   *
   * Post-wire registration runs through a real `@Injectable()` seeder
   * (`HttpFeatureRegistrar`) that implements `OnApplicationBootstrap`
   * and resolves middleware/interceptor instances via `ModuleRef` — no
   * synthetic bootstrap token, no constructor side effects.
   *
   * @param options - Feature options (all fields optional).
   * @returns A dynamic module wiring the requested providers.
   *
   * @example
   * ```typescript
   * import { FetchConnector } from '@stackra/http/fetch';
   *
   * @Module({
   *   imports: [
   *     // Register a custom driver:
   *     HttpModule.forFeature({ driver: 'fetch', connector: FetchConnector }),
   *
   *     // Add a connection + scoped middleware/interceptors:
   *     HttpModule.forFeature({
   *       connections: {
   *         billing: { baseURL: 'https://billing.example.com', timeout: 15_000 },
   *       },
   *       middleware: [{ use: AuditMiddleware, connection: 'billing' }],
   *       interceptors: [{ use: TraceInterceptor, connection: ['api', 'billing'] }],
   *     }),
   *   ],
   * })
   * export class BillingModule {}
   * ```
   */
  public static forFeature(options: IHttpModuleFeatureOptions): DynamicModule {
    const connectionEntries = Object.entries(options.connections ?? {});
    const middlewareEntries = options.middleware ?? [];
    const interceptorEntries = options.interceptors ?? [];
    const { driver, connector } = options;

    const connectionTokens = connectionEntries.map(([name]) => getHttpConnectionToken(name));
    const connectionProviders = connectionEntries.map(([name, config]) => ({
      provide: getHttpConnectionToken(name),
      useFactory: async (manager: HttpManager): Promise<IHttpClient> => {
        manager.addConnection(name, config);
        return manager.connection(name);
      },
      inject: [HttpManager],
    }));

    const uniqueMiddlewareClasses = Array.from(new Set(middlewareEntries.map((e) => e.use)));
    const uniqueInterceptorClasses = Array.from(new Set(interceptorEntries.map((e) => e.use)));

    /**
     * Per-feature seeder. A standard `@Injectable()` provider whose
     * `onApplicationBootstrap()` performs post-wire registration once
     * every module has initialised. Middleware/interceptor instances
     * are resolved from the container via `ModuleRef` (inversion of
     * control) rather than being force-instantiated by a marker token.
     */
    @Injectable()
    class HttpFeatureRegistrar implements OnApplicationBootstrap {
      public constructor(
        @Inject(HTTP_MANAGER) private readonly manager: IHttpManager,
        private readonly moduleRef: ModuleRef
      ) {}

      public async onApplicationBootstrap(): Promise<void> {
        // 1. Register a custom driver, if requested.
        if (driver && connector) {
          const instance = this.moduleRef.get<IHttpConnector>(connector as Type<IHttpConnector>);
          if (instance) {
            this.manager.extend(driver, (config) =>
              this.manager.createClientFromConnector(instance, config)
            );
          }
        }

        // 2. Add feature connections so middleware can target them.
        for (const [name, config] of connectionEntries) {
          this.manager.addConnection(name, config);
        }

        // 3. Register middleware on their target connections.
        for (const entry of middlewareEntries) {
          const instance = this.moduleRef.get<IHttpMiddleware>(entry.use);
          if (!instance) continue;
          const meta = getHttpMiddlewareMetadata(entry.use as Function);
          const priority = entry.priority ?? meta?.priority ?? 50;
          const name = entry.name ?? meta?.name ?? entry.use.name;
          for (const target of HttpModule.resolveTargets(entry.connection, this.manager)) {
            const registry = await this.manager.getMiddlewareRegistry(target);
            registry.registerWithPriority(name, instance, priority);
          }
        }

        // 4. Register interceptors on their target connections.
        for (const entry of interceptorEntries) {
          const instance = this.moduleRef.get<IHttpInterceptor>(entry.use);
          if (!instance) continue;
          const meta = getHttpInterceptorMetadata(entry.use as Function);
          const priority = entry.priority ?? meta?.priority ?? 50;
          const name = entry.name ?? meta?.name ?? entry.use.name;
          for (const target of HttpModule.resolveTargets(entry.connection, this.manager)) {
            const registry = await this.manager.getInterceptorRegistry(target);
            registry.registerWithPriority(name, instance, priority);
          }
        }
      }
    }

    const providers: unknown[] = [
      ...uniqueMiddlewareClasses,
      ...uniqueInterceptorClasses,
      ...connectionProviders,
      HttpFeatureRegistrar,
    ];
    if (connector) providers.unshift(connector);

    return {
      module: HttpModule,
      providers: providers as never[],
      exports: connectionTokens,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — provider builders
  // ────────────────────────────────────────────────────────────────────

  /**
   * Build connector registration providers for the built-in drivers.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildConnectorRegistrations(): { providers: any[] } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers: any[] = [];

    for (const { driver, type } of BUILT_IN_CONNECTORS) {
      providers.push(type);
      providers.push({
        provide: seedLoaderToken(`http-connector:${driver}`),
        useFactory: (manager: HttpManager, connector: IHttpConnector) =>
          createSeedLoader(() => {
            manager.extend(driver, (config) =>
              manager.createClientFromConnector(connector, config)
            );
          }),
        inject: [HttpManager, type],
      });
    }

    return { providers };
  }

  /**
   * Build middleware registration providers — register every
   * built-in middleware on every configured connection.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildMiddlewareRegistrations(config: IHttpModuleOptions): { providers: any[] } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers: any[] = [];

    for (const middlewareClass of BUILT_IN_MIDDLEWARE) {
      providers.push(middlewareClass);
    }

    const connectionNames = Object.keys(config.connections);
    for (const middlewareClass of BUILT_IN_MIDDLEWARE) {
      providers.push({
        provide: seedLoaderToken(`http-middleware:${middlewareClass.name}`),
        useFactory: (manager: IHttpManager, instance: IHttpMiddleware) =>
          createSeedLoader(async () => {
            const meta = getHttpMiddlewareMetadata(middlewareClass);
            const priority = meta?.priority ?? 50;
            const name = meta?.name ?? middlewareClass.name;
            for (const conn of connectionNames) {
              const registry = await manager.getMiddlewareRegistry(conn);
              registry.registerWithPriority(name, instance, priority);
            }
          }),
        inject: [HttpManager, middlewareClass],
      });
    }

    return { providers };
  }

  /**
   * Build interceptor registration providers — register every
   * built-in interceptor on every configured connection.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildInterceptorRegistrations(config: IHttpModuleOptions): { providers: any[] } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers: any[] = [];

    for (const interceptorClass of BUILT_IN_INTERCEPTORS) {
      providers.push(interceptorClass);
    }

    const connectionNames = Object.keys(config.connections);
    for (const interceptorClass of BUILT_IN_INTERCEPTORS) {
      providers.push({
        provide: seedLoaderToken(`http-interceptor:${interceptorClass.name}`),
        useFactory: (manager: IHttpManager, instance: IHttpInterceptor) =>
          createSeedLoader(async () => {
            const meta = getHttpInterceptorMetadata(interceptorClass);
            const priority = meta?.priority ?? 50;
            const name = meta?.name ?? interceptorClass.name;
            for (const conn of connectionNames) {
              const registry = await manager.getInterceptorRegistry(conn);
              registry.registerWithPriority(name, instance, priority);
            }
          }),
        inject: [HttpManager, interceptorClass],
      });
    }

    return { providers };
  }

  /** Resolve the connection list for a feature middleware/interceptor entry. */
  private static resolveTargets(
    connection: string | string[] | undefined,
    manager: IHttpManager
  ): string[] {
    if (connection === undefined) return [manager.getDefaultConnectionName()];
    if (Array.isArray(connection)) return connection;
    return [connection];
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — config validation
  // ────────────────────────────────────────────────────────────────────

  /**
   * Surface configuration mistakes at bootstrap.
   */
  private static validate(config: IHttpModuleOptions): void {
    if (!config) {
      throw new HttpModuleOptionsError('[HttpModule] forRoot() requires a configuration object.');
    }

    if (!config.default) {
      throw new HttpModuleOptionsError('[HttpModule] config.default is required.');
    }

    if (!config.connections || Object.keys(config.connections).length === 0) {
      throw new HttpModuleOptionsError(
        '[HttpModule] config.connections must define at least one entry.'
      );
    }

    if (!config.connections[config.default]) {
      throw new HttpModuleOptionsError(
        `[HttpModule] config.default "${config.default}" is not present in config.connections.`
      );
    }
  }
}
