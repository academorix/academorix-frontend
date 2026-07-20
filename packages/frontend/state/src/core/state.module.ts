/**
 * @file state.module.ts
 * @module @stackra/state/core
 * @description DI module for the reactive store layer — the one consumers import.
 *
 *   - `StateModule.forRoot()` registers the global `StateRegistry` and the
 *     three broadcasters (cross-tab, realtime, persistence). Call once.
 *   - `StateModule.forFeature(options)` registers one or more reactive stores
 *     with their reactive capabilities (optimistic, crossTab, realtime,
 *     persistence). Call from any module that needs reactive state.
 *
 *   The store-backed query layer lives in the separate `@stackra/query`
 *   package, which builds on this one.
 */

import { Module, registerWith } from "@stackra/container";
import type { DynamicModule } from "@stackra/container";
import { DevtoolsModule } from "@stackra/devtools";
import { Store } from "@tanstack/store";

import { STATE_REGISTRY, EVENT_EMITTER } from "@stackra/contracts";
import type { IEventEmitter, IStoreFeatureConfig, FactoryProvider } from "@stackra/contracts";
import { StateRegistry } from "./registries/state.registry";
import { CrossTabBroadcaster } from "./broadcasters/cross-tab.broadcaster";
import { RealtimeBroadcaster } from "./broadcasters/realtime.broadcaster";
import { PersistenceBroadcaster } from "./broadcasters/persistence.broadcaster";
import { createReactiveStore } from "./utils/create-reactive-store.util";
import type { StateFeatureOptions } from "./interfaces/state-feature-options.interface";
import { StateDevtoolsPanel } from "../react/devtools/state.devtools-panel";

/** A store-registration entry accepted by `forFeature`. */
type StoreConfig<S> = StateFeatureOptions<S> | IStoreFeatureConfig<S>;

/**
 * StateModule — reactive state management with DI integration.
 *
 * Manages the lifecycle of TanStack Stores within the DI container. Stores
 * are created during module initialization and registered in the
 * `StateRegistry` for introspection. Broadcasters handle cross-tab sync,
 * realtime updates, and persistence automatically.
 */
@Module({})
export class StateModule {
  /**
   * Register the global StateRegistry and broadcasters.
   *
   * Call once in your root `AppModule`. Makes the registry and all
   * broadcasters injectable everywhere.
   */
  public static forRoot(): DynamicModule {
    return {
      module: StateModule,
      global: true,
      // Contribute the devtools state panel. `DevtoolsModule.forFeature`
      // is fail-soft — when the consumer app hasn't wired
      // `DevtoolsModule.forRoot()` the seed loader becomes a no-op
      // and the panel doesn't appear anywhere.
      imports: [DevtoolsModule.forFeature([StateDevtoolsPanel])],
      providers: [
        { provide: StateRegistry, useClass: StateRegistry },
        { provide: STATE_REGISTRY, useExisting: StateRegistry },
        { provide: CrossTabBroadcaster, useClass: CrossTabBroadcaster },
        { provide: RealtimeBroadcaster, useClass: RealtimeBroadcaster },
        { provide: PersistenceBroadcaster, useClass: PersistenceBroadcaster },
      ],
      exports: [
        StateRegistry,
        STATE_REGISTRY,
        CrossTabBroadcaster,
        RealtimeBroadcaster,
        PersistenceBroadcaster,
      ],
    };
  }

  /**
   * Register one or more reactive stores with full reactive capabilities.
   *
   * Each store is:
   * 1. Created as a `Store<S>` with the given initial state (auto-event-emitting).
   * 2. Registered in the DI container under the specified token.
   * 3. Indexed in the `StateRegistry` for devtools introspection.
   * 4. Wired to broadcasters based on config (crossTab, realtime, persistence).
   *
   * @typeParam S - The state shape (inferred from `initialState`).
   * @param options - Single store config or an array of store configs.
   *
   * @example
   * ```typescript
   * StateModule.forFeature<ThemeState>({
   *   name: "theme",
   *   token: THEME_STORE,
   *   initialState: { mode: "system" },
   *   crossTab: true,
   *   persistence: "localStorage",
   * })
   * ```
   */
  public static forFeature<S = unknown>(options: StoreConfig<S> | StoreConfig<S>[]): DynamicModule {
    const entries = Array.isArray(options) ? options : [options];

    const providers = entries.flatMap((entry) => [
      // Register the Store instance under the token (with auto-event emission).
      {
        provide: entry.token,
        useFactory: (emitter?: IEventEmitter) =>
          createReactiveStore(entry.name, entry.initialState as Record<string, unknown>, emitter),
        inject: [{ token: EVENT_EMITTER, optional: true }],
      },
      // Index the store in the StateRegistry for introspection.
      registerWith<[StateRegistry, Store<unknown>]>(
        [StateRegistry, entry.token],
        (registry, store) => {
          registry.registerStore(entry.name, entry.token, store, entry.initialState);
        },
      ),
      // Wire broadcasters based on config.
      ...StateModule.createBroadcasterRegistrations(entry),
    ]);

    return {
      module: StateModule,
      providers,
      exports: entries.map((e) => e.token),
    };
  }

  /**
   * Create broadcaster registration providers based on store config.
   */
  private static createBroadcasterRegistrations<S>(entry: StoreConfig<S>): FactoryProvider[] {
    const registrations: FactoryProvider[] = [];
    const config = entry as IStoreFeatureConfig<S>;

    // Cross-tab sync (default: true).
    if (config.crossTab ?? true) {
      registrations.push(
        registerWith<CrossTabBroadcaster>(CrossTabBroadcaster, (broadcaster) => {
          broadcaster.enableForStore(entry.name);
        }),
      );
    }

    // Realtime sync (default: false).
    if (config.realtime ?? false) {
      registrations.push(
        registerWith<RealtimeBroadcaster>(RealtimeBroadcaster, (broadcaster) => {
          broadcaster.enableForStore(entry.name, config.updateStrategy ?? "instant");
        }),
      );
    }

    // Persistence (default: "localStorage" — opt out with false).
    const persistence = config.persistence ?? "localStorage";
    if (persistence !== false) {
      registrations.push(
        registerWith<PersistenceBroadcaster>(PersistenceBroadcaster, (broadcaster) => {
          broadcaster.enableForStore(entry.name, persistence);
        }),
      );
    }

    return registrations;
  }
}
