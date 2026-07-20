/**
 * @file events.module.ts
 * @module @stackra/events/core
 * @description DI module for the event system.
 *
 *   Registers `EventEmitter`, `EventTransportRegistry`, and
 *   `EventSubscribersLoader` globally. Works in both container
 *   (frontend) and NestJS (backend).
 *
 *   The resolved config is bound under
 *   `EVENT_EMITTER_CONFIG_INTERNAL`, a package-private symbol that
 *   only classes inside `@stackra/events` inject. Consumers who want
 *   to read the same config value do so via
 *   `@Inject(eventsConfig.KEY)` on the app-owned `registerAs`
 *   factory — never through this token.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { EVENT_EMITTER } from "@stackra/contracts";
import type { IConfigModuleAsyncOptions, IPublishableConsumer } from "@stackra/contracts";
import { Path } from "@stackra/support";

import { EVENT_EMITTER_CONFIG_INTERNAL, EVENT_TRANSPORT_REGISTRY_TOKEN } from "./constants";
import { EventEmitter } from "./services/event-emitter.service";
import { EventSubscribersLoader } from "./services/event-subscribers-loader.service";
import { EventTransportRegistry } from "./registries/event-transport.registry";

import type { IEventEmitterConfig } from "./interfaces";

/**
 * Event emitter DI module.
 *
 * Registers the `EventEmitter` as a global singleton with configurable
 * wildcard matching, max listeners, and delimiter. Also registers
 * the auto-discovery loader for `@OnEvent` and `@EventTransport`.
 *
 * @example
 * ```typescript
 * // Preferred — `@stackra/config` factory + `forRootAsync`:
 * import { registerAs, env } from '@stackra/config';
 * import { EventEmitterModule } from '@stackra/events';
 *
 * const eventsConfig = registerAs('events', () => ({
 *   wildcard: env.bool('EVENTS_WILDCARD', true),
 *   delimiter: '.',
 *   maxListeners: env.number('EVENTS_MAX_LISTENERS', 20),
 * }));
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true, load: [eventsConfig] }),
 *     EventEmitterModule.forRootAsync(eventsConfig.asProvider()),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class EventEmitterModule {
  /**
   * Absolute path to the `@stackra/events` package root.
   *
   * Resolved once from `import.meta.url` at module load. `public` so
   * `@stackra/console`'s `PublishableConsumer` can auto-read it and
   * fill in `packageRoot` on every `.publish(entry)` call — the
   * module doesn't have to pass it manually.
   *
   * `../../..` walks from `packages/events/src/core/` up to
   * `packages/events/`.
   */
  public static readonly PACKAGE_ROOT = Path.packageRoot(import.meta.url);

  /**
   * Register the event emitter module with a fully-formed config.
   *
   * Prefer `forRootAsync(eventsConfig.asProvider())` in app code —
   * this synchronous form is kept as an escape hatch for tests and
   * inline configs. Passing no config falls back to the emitter's
   * own defaults (wildcard=false, delimiter='.', maxListeners=10) —
   * see `EventEmitter`'s constructor.
   *
   * @param config - Event emitter configuration (optional).
   * @returns A `DynamicModule` binding `EventEmitter` + registry.
   */
  public static forRoot(config?: IEventEmitterConfig): DynamicModule {
    // Unlike cache/logger/queue, events' `forRoot` accepts an OPTIONAL
    // config: the EventEmitter service internally applies its own
    // per-field defaults (wildcard=false, …) via `??` so passing
    // `undefined` still boots a working emitter. Kept optional for
    // back-compat with the many test call sites that call
    // `EventEmitterModule.forRoot()` bare.
    return {
      module: EventEmitterModule,
      global: true,
      providers: [
        // Package-internal binding — only classes inside @stackra/events
        // inject this token. When `config` is `undefined` the emitter
        // reads its `??` defaults from the field-level fallbacks.
        { provide: EVENT_EMITTER_CONFIG_INTERNAL, useValue: config },

        // EventEmitter singleton — the class and its symbol alias.
        EventEmitter,
        { provide: EVENT_EMITTER, useExisting: EventEmitter },

        // Transport registry (aliased to a package-owned symbol so
        // cross-package transports resolve to the same instance).
        EventTransportRegistry,
        { provide: EVENT_TRANSPORT_REGISTRY_TOKEN, useExisting: EventTransportRegistry },

        // Auto-discovery loader — runs onApplicationBootstrap and
        // wires up decorated `@OnEvent` methods + `@EventTransport`
        // classes discovered in the container.
        EventSubscribersLoader,
      ],
      // NOTE: `EVENT_EMITTER_CONFIG_INTERNAL` is intentionally NOT
      // exported — it is a package-private binding. Downstream
      // modules that need the config should inject via the app-owned
      // `eventsConfig.KEY`.
      exports: [
        EventEmitter,
        EVENT_EMITTER,
        EventTransportRegistry,
        EVENT_TRANSPORT_REGISTRY_TOKEN,
      ],
    };
  }

  /**
   * Register the event emitter module with an async config.
   *
   * Accepts either the traditional `{ useFactory, inject, imports }`
   * shape OR the exact object returned by `eventsConfig.asProvider()`
   * (they're structurally identical — both satisfy
   * `IConfigModuleAsyncOptions<IEventEmitterConfig>`).
   *
   * @param options - Async configuration options.
   * @returns A `DynamicModule` with the same provider tree as
   *   `forRoot`, but the config resolves via `options.useFactory`.
   */
  public static forRootAsync(
    options: IConfigModuleAsyncOptions<IEventEmitterConfig>,
  ): DynamicModule {
    return {
      module: EventEmitterModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: EVENT_EMITTER_CONFIG_INTERNAL,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        EventEmitter,
        { provide: EVENT_EMITTER, useExisting: EventEmitter },
        EventTransportRegistry,
        { provide: EVENT_TRANSPORT_REGISTRY_TOKEN, useExisting: EventTransportRegistry },
        EventSubscribersLoader,
      ],
      exports: [
        EventEmitter,
        EVENT_EMITTER,
        EventTransportRegistry,
        EVENT_TRANSPORT_REGISTRY_TOKEN,
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // configurePublishables — module-level manifest of publishable files
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Declare every publishable resource `@stackra/events` owns.
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
      tag: "events-config",
      description: "Reference @stackra/events config file for the app.",
      files: ["config/events.config.ts"],
    });
  }
}
