/**
 * @file devtools.module.ts
 * @module @stackra/devtools/core
 * @description The devtools DI module.
 *
 *   `forRoot(options)` — provides the merged config, both registries
 *   (panels + inspector), both loaders (which run at
 *   `onApplicationBootstrap` via
 *   `discovery.getProvidersByMetadata(...)`), the frame-state
 *   service, and the analytics fan-out.
 *
 *   `forRootAsync(options)` — same shape but the config resolves
 *   via a `useFactory`; both static factories route through
 *   `mergeConfig` so defaults land in one place.
 *
 *   `forFeature(panels)` / `forInspectorSource(sources)` — register
 *   additional panels + sources through the shared
 *   `createSeedLoader` from `@stackra/support`, honouring the
 *   `.kiro/steering/module-lifecycle.md` rule (no bootstrap classes,
 *   no `useFactory` returning a sentinel).
 *
 *   The core module is deliberately React-free. Built-in panels
 *   (Overview + Actions) live in the react subpath and are
 *   registered by the `DevtoolsProvider` at mount time via
 *   `useDevtoolsPanel(...)`. This keeps the core module composable
 *   with any UI framework (a future native-only mode could ship
 *   different built-ins).
 */

import { Module, type DynamicModule, type Type } from "@stackra/container";
import {
  DEVTOOLS_INSPECTOR_REGISTRY,
  DEVTOOLS_REGISTRY,
  type IDevtoolsInspectorRegionSource,
  type IDevtoolsInspectorRegistry,
  type IDevtoolsPanel,
  type IDevtoolsPanelsRegistry,
  type IAsyncModuleOptions,
} from "@stackra/contracts";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";

import { DEVTOOLS_CONFIG } from "./constants";
import { DevtoolsInspectorRegistry } from "./registries/devtools-inspector.registry";
import { DevtoolsPanelsRegistry } from "./registries/devtools-panels.registry";
import { DevtoolsAnalyticsService } from "./services/devtools-analytics.service";
import { DevtoolsFrameStateService } from "./services/devtools-frame-state.service";
import { DevtoolsInspectorLoader } from "./services/devtools-inspector-loader.service";
import { DevtoolsPanelsLoader } from "./services/devtools-panels-loader.service";
import { mergeConfig } from "./utils/merge-config.util";

import type { IDevtoolsModuleOptions } from "./interfaces/devtools-module-options.interface";

/**
 * The devtools DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     DevtoolsModule.forRoot({
 *       position: 'right',
 *       initialSize: 480,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class DevtoolsModule {
  /**
   * Register the devtools module globally.
   *
   * @param options - Devtools configuration. When omitted, every
   *   field falls back to `DEFAULT_DEVTOOLS_CONFIG` via
   *   `mergeConfig`.
   */
  public static forRoot(options?: IDevtoolsModuleOptions): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: DevtoolsModule,
      global: true,
      providers: [
        { provide: DEVTOOLS_CONFIG, useValue: config },
        // Registries — bound to their contract tokens via
        // `useExisting` so consumers can inject either the class or
        // the token.
        DevtoolsPanelsRegistry,
        { provide: DEVTOOLS_REGISTRY, useExisting: DevtoolsPanelsRegistry },
        DevtoolsInspectorRegistry,
        {
          provide: DEVTOOLS_INSPECTOR_REGISTRY,
          useExisting: DevtoolsInspectorRegistry,
        },
        // Discovery loaders — pick up every `@DevtoolsPanel(...)`
        // and `@DevtoolsInspectorSource(...)` at
        // `onApplicationBootstrap`.
        DevtoolsPanelsLoader,
        DevtoolsInspectorLoader,
        // Frame-state + analytics services — both accept optional
        // dependencies internally so they resolve cleanly even
        // when `@stackra/storage` / `@stackra/events` aren't wired.
        DevtoolsFrameStateService,
        DevtoolsAnalyticsService,
      ],
      exports: [
        DEVTOOLS_CONFIG,
        DEVTOOLS_REGISTRY,
        DEVTOOLS_INSPECTOR_REGISTRY,
        DevtoolsPanelsRegistry,
        DevtoolsInspectorRegistry,
        DevtoolsFrameStateService,
        DevtoolsAnalyticsService,
      ],
    };
  }

  /**
   * Register the devtools module with async configuration.
   *
   * The factory receives the resolved dependencies listed in
   * `inject` and returns (possibly asynchronously) the module
   * options; the resolver pipes them through `mergeConfig` before
   * binding to the `DEVTOOLS_CONFIG` token.
   */
  public static forRootAsync(options: IAsyncModuleOptions<IDevtoolsModuleOptions>): DynamicModule {
    return {
      module: DevtoolsModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DEVTOOLS_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        DevtoolsPanelsRegistry,
        { provide: DEVTOOLS_REGISTRY, useExisting: DevtoolsPanelsRegistry },
        DevtoolsInspectorRegistry,
        {
          provide: DEVTOOLS_INSPECTOR_REGISTRY,
          useExisting: DevtoolsInspectorRegistry,
        },
        DevtoolsPanelsLoader,
        DevtoolsInspectorLoader,
        DevtoolsFrameStateService,
        DevtoolsAnalyticsService,
      ],
      exports: [
        DEVTOOLS_CONFIG,
        DEVTOOLS_REGISTRY,
        DEVTOOLS_INSPECTOR_REGISTRY,
        DevtoolsPanelsRegistry,
        DevtoolsInspectorRegistry,
        DevtoolsFrameStateService,
        DevtoolsAnalyticsService,
      ],
    };
  }

  /**
   * Register additional panel classes.
   *
   * Every class is instantiated by the container (`@Injectable()`
   * required — stamped for you by `@DevtoolsPanel(...)`) then
   * registered with the panels registry during
   * `onApplicationBootstrap` via a `createSeedLoader` provider
   * under a unique `seedLoaderToken`. Multiple `forFeature` calls
   * compose cleanly under the container's last-wins semantics
   * because each seed token is unique.
   *
   * `DEVTOOLS_REGISTRY` is injected with `{ optional: true }` so a
   * feature package can declare `DevtoolsModule.forFeature([Panel])`
   * unconditionally — when the consumer app hasn't wired
   * `DevtoolsModule.forRoot()`, the registry is absent and the seed
   * loader is a no-op instead of a container resolution error.
   *
   * @param panels - A single panel class or an array. Each class
   *   MUST implement `IDevtoolsPanel`.
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [DevtoolsModule.forFeature([NetworkDevtoolsPanel])],
   * })
   * export class NetworkModule {}
   * ```
   */
  public static forFeature(
    panels: Type<IDevtoolsPanel> | readonly Type<IDevtoolsPanel>[],
  ): DynamicModule {
    // Normalise once so the flatMap below has a properly-typed array.
    // `Array.isArray(...)` widens a `readonly T[]` union member to
    // `any[]` in the strict lint preset — bind through a typed const
    // instead of re-narrowing at every callsite.
    const classes: readonly Type<IDevtoolsPanel>[] = Array.isArray(panels) ? panels : [panels];
    return {
      module: DevtoolsModule,
      providers: classes.flatMap((panelClass: Type<IDevtoolsPanel>) => [
        panelClass,
        {
          // Unique seed token per panel class so contributions don't
          // collide under the container's last-wins semantics.
          provide: seedLoaderToken(`devtools:panel:${panelClass.name}`),
          useFactory: (registry: IDevtoolsPanelsRegistry | undefined, instance: IDevtoolsPanel) => {
            // Fail-soft — when `DevtoolsModule.forRoot()` isn't wired
            // in the consumer app the panel registry is absent; the
            // panel just doesn't appear anywhere. Feature packages
            // therefore call `forFeature` unconditionally without
            // making `@stackra/devtools` a required peer.
            if (!registry) {
              return createSeedLoader(() => {
                /* no-op — devtools not mounted */
              });
            }
            return createSeedLoader(() => registry.register(instance));
          },
          inject: [{ token: DEVTOOLS_REGISTRY, optional: true }, panelClass],
        },
      ]),
      exports: [...classes],
    };
  }

  /**
   * Register additional inspector-source classes.
   *
   * Same shape + semantics as `forFeature`, but seeds into the
   * inspector registry instead. `DEVTOOLS_INSPECTOR_REGISTRY` is
   * injected optionally for the same fail-soft reason as
   * `forFeature` — the source class binds unconditionally, and the
   * seed loader becomes a no-op when devtools isn't wired at the
   * root.
   */
  public static forInspectorSource(
    sources: Type<IDevtoolsInspectorRegionSource> | readonly Type<IDevtoolsInspectorRegionSource>[],
  ): DynamicModule {
    // Same normalisation pattern as `forFeature` above — see the note
    // there for why the `Array.isArray` result is re-bound through a
    // typed const.
    const classes: readonly Type<IDevtoolsInspectorRegionSource>[] = Array.isArray(sources)
      ? sources
      : [sources];
    return {
      module: DevtoolsModule,
      providers: classes.flatMap((sourceClass: Type<IDevtoolsInspectorRegionSource>) => [
        sourceClass,
        {
          provide: seedLoaderToken(`devtools:inspector:${sourceClass.name}`),
          useFactory: (
            registry: IDevtoolsInspectorRegistry | undefined,
            instance: IDevtoolsInspectorRegionSource,
          ) => {
            // Fail-soft — see `forFeature` above.
            if (!registry) {
              return createSeedLoader(() => {
                /* no-op — devtools not mounted */
              });
            }
            return createSeedLoader(() => registry.register(instance));
          },
          inject: [{ token: DEVTOOLS_INSPECTOR_REGISTRY, optional: true }, sourceClass],
        },
      ]),
      exports: [...classes],
    };
  }
}
