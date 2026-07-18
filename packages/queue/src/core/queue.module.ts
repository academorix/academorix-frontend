/**
 * @file queue.module.ts
 * @module @stackra/queue/core
 * @description DI module for the queue system. Registers `QueueManager`
 *   globally under both the class token and the `QUEUE_MANAGER` alias.
 *
 *   The resolved config is bound under `QUEUE_CONFIG_INTERNAL`, a
 *   package-private symbol that only classes inside `@stackra/queue`
 *   inject. Consumers who want to read the same config value do so
 *   via `@Inject(queueConfig.KEY)` on the app-owned `registerAs`
 *   factory — never through this token.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { QUEUE_MANAGER } from "@stackra/contracts";
import { Path, createSeedLoader, seedLoaderToken } from "@stackra/support";

import { QUEUE_CONFIG_INTERNAL } from "./constants/queue-config-internal.constant";
import { QueueManager } from "./services/queue-manager.service";

import type { IQueueModuleOptions } from "./interfaces";
import type { IConfigModuleAsyncOptions, IPublishableConsumer } from "@stackra/contracts";

// NOTE: `@stackra/devtools` runtime is pending. Once promoted, the
// `QueueDevtoolsPanel` (built with `@DevtoolsPanel(...)` from
// `@stackra/decorators/devtools`) can be contributed here via
// `imports: [DevtoolsModule.forFeature([QueueDevtoolsPanel])]`.

/**
 * Queue DI module.
 *
 * @example
 * ```typescript
 * // Preferred — `@stackra/config` factory + `forRootAsync`:
 * import { registerAs, env } from '@stackra/config';
 * import { QueueModule } from '@stackra/queue';
 *
 * const queueConfig = registerAs('queue', () => ({
 *   default: env('QUEUE_DRIVER', 'memory'),
 *   connections: { memory: { driver: 'memory' } },
 *   worker: { tries: 3, backoffMs: 1000 },
 * }));
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [queueConfig] }),
 *     QueueModule.forRootAsync(queueConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class QueueModule {
  /**
   * Absolute path to the `@stackra/queue` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it and
   * fill in `packageRoot` on every `.publish(entry)` call — the
   * module doesn't have to pass it manually.
   *
   * `../../..` walks from `packages/queue/src/core/` up to
   * `packages/queue/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  /**
   * Register the queue module globally with a fully-formed config.
   *
   * Prefer `forRootAsync(queueConfig.asProvider())` in app code —
   * this synchronous form is kept as an escape hatch for tests and
   * inline configs.
   *
   * @param config - The fully-formed queue module configuration.
   * @returns A `DynamicModule` binding `QueueManager` + its alias.
   * @throws Error when `config` is `undefined` / `null`. Defaults
   *   now live inline in the app-level `registerAs` factory.
   */
  public static forRoot(config: IQueueModuleOptions): DynamicModule {
    // Guard clause — the caller must supply a fully-formed config.
    // We used to fall back to an (empty) `DEFAULT_QUEUE_CONFIG`
    // constant; it was removed in the `@stackra/config` migration.
    if (config === undefined || config === null) {
      throw new Error(
        "@stackra/queue: QueueModule.forRoot(config) requires a config argument. " +
          "Pass a plain `IQueueModuleOptions`, or use " +
          "`QueueModule.forRootAsync(queueConfig.asProvider())` with a " +
          "`registerAs(...)` factory from `@stackra/config`. See " +
          ".kiro/specs/stackra-config-package/PLAN.md §9 for consumer patterns.",
      );
    }

    return {
      module: QueueModule,
      global: true,
      providers: [
        // Package-internal binding — only classes inside @stackra/queue
        // inject this token. Consumers use `queueConfig.KEY` at the app
        // level instead.
        { provide: QUEUE_CONFIG_INTERNAL, useValue: config },
        QueueManager,
        { provide: QUEUE_MANAGER, useExisting: QueueManager },
      ],
      // NOTE: `QUEUE_CONFIG_INTERNAL` is intentionally NOT exported —
      // it is a package-private binding. Downstream modules that need
      // the config should inject via the app-owned `queueConfig.KEY`.
      exports: [QUEUE_MANAGER, QueueManager],
    };
  }

  /**
   * Register the queue module globally with an async config.
   *
   * Accepts either the traditional `{ useFactory, inject, imports }`
   * shape OR the exact object returned by `queueConfig.asProvider()`
   * (they're structurally identical — both satisfy
   * `IConfigModuleAsyncOptions<IQueueModuleOptions>`).
   *
   * @param options - Async configuration options.
   * @returns A `DynamicModule` with the same provider tree as
   *   `forRoot`, but the config resolves via `options.useFactory`.
   */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<IQueueModuleOptions>,
  ): DynamicModule {
    return {
      module: QueueModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: QUEUE_CONFIG_INTERNAL,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        QueueManager,
        { provide: QUEUE_MANAGER, useExisting: QueueManager },
      ],
      exports: [QUEUE_MANAGER, QueueManager],
    };
  }

  /**
   * Register a custom queue connector for a driver name.
   *
   * The connector is instantiated via DI and registered on the
   * `QueueManager` via `extend(driver, factory)`. Runs through the
   * shared `createSeedLoader` + `seedLoaderToken` helpers so it
   * executes in the proper lifecycle phase — never as a synthetic
   * sentinel factory (see `.kiro/steering/module-lifecycle.md`).
   *
   * @param driver - Driver name (e.g., 'bullmq', 'sqs', 'kafka').
   * @param connectorType - Connector class implementing `IQueueConnector`.
   * @returns A `DynamicModule` contributing the connector + its seeder.
   *
   * @example
   * ```typescript
   * QueueModule.forFeature('bullmq', BullMQConnector);
   * // or register several at once:
   * QueueModule.forFeature({ bullmq: BullMQConnector, sqs: SqsConnector });
   * ```
   */
  public static forFeature(driver: string, connectorType: Function): DynamicModule;
  public static forFeature(connectors: Record<string, Function>): DynamicModule;
  public static forFeature(
    driverOrConnectors: string | Record<string, Function>,
    connectorType?: Function,
  ): DynamicModule {
    // Normalise both overloads to a `[name, ctor][]` list so the
    // provider fan-out below is a single loop.
    const entries: [string, Function][] =
      typeof driverOrConnectors === "string"
        ? [[driverOrConnectors, connectorType as Function]]
        : Object.entries(driverOrConnectors);

    return {
      module: QueueModule,
      providers: entries.flatMap(([driver, ctor]) => [
        ctor as any,
        {
          // `seedLoaderToken(...)` returns a fresh `Symbol()` per call
          // so multiple `forFeature` contributions don't collide under
          // the container's last-wins token semantics.
          provide: seedLoaderToken(`queue-connector:${driver}`),
          useFactory: (manager: QueueManager, connector: any) =>
            createSeedLoader(() => manager.extend(driver, () => connector)),
          inject: [QueueManager, ctor as any],
        },
      ]),
      exports: entries.map(([, ctor]) => ctor as any),
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/queue` owns.
   *
   * Discovered at CLI boot by `@stackra/console`'s `PublishableLoader`.
   * The SPA never reaches this method — `PublishableLoader` runs only
   * inside the CLI kernel.
   *
   * `packageRoot` is auto-filled from `PACKAGE_ROOT` above, so entries
   * only declare their `files` (paths relative to package root — the
   * destination mirrors the same relative path in the consumer app).
   *
   * @param consumer - Fluent builder that accepts `.publish(entry)` calls.
   */
  public static configurePublishables(consumer: IPublishableConsumer): void {
    consumer.publish({
      tag: "queue-config",
      description: "Reference @stackra/queue config file for the app.",
      files: ["config/queue.config.ts"],
    });
  }
}
