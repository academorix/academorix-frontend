/**
 * @file settings.module.ts
 * @module @stackra/settings/core
 * @description DI module for the settings system.
 *
 *   `forRoot(options?)` binds config + service + registry + manager +
 *   schema loader + broadcast listener. `forRootAsync(options)` does
 *   the same via an async factory. `forFeature([Dto])` registers a
 *   client-declared DTO through the canonical `createSeedLoader` /
 *   `seedLoaderToken` pair so registration runs in the proper
 *   `onApplicationBootstrap` phase (never a side-effecting factory).
 */

import { Module, type DynamicModule, type Type } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";
import {
  IAsyncModuleOptions,
  SETTINGS_CONFIG,
  SETTINGS_MANAGER,
  SETTINGS_REGISTRY,
  SETTINGS_SERVICE,
  type ISettingsModuleOptions,
  type ISettingsRegistry,
} from "@stackra/contracts";

import { SettingsRegistry } from "@/core/registries/settings.registry";
import {
  SettingsBroadcastListener,
  SettingsSchemaLoader,
  SettingsService,
  SettingsStoreManager,
} from "@/core/services";
import { mergeConfig } from "@/core/utils/merge-config.util";

/**
 * Settings DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     SettingsModule.forRoot({
 *       default: 'localStorage',
 *       api: { autoLoadSchema: true },
 *       broadcasting: { enabled: true },
 *     }),
 *     SettingsModule.forFeature([DisplaySettings, TerminalSettings]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class SettingsModule {
  /**
   * Register the settings module globally with static configuration.
   *
   * @param options - Optional user config; defaults applied by
   *   `mergeConfig`.
   * @returns Dynamic module definition.
   */
  public static forRoot(options?: ISettingsModuleOptions): DynamicModule {
    return {
      module: SettingsModule,
      global: true,
      providers: [
        { provide: SETTINGS_CONFIG, useValue: mergeConfig(options) },

        SettingsRegistry,
        { provide: SETTINGS_REGISTRY, useExisting: SettingsRegistry },

        SettingsStoreManager,
        { provide: SETTINGS_MANAGER, useExisting: SettingsStoreManager },

        SettingsService,
        { provide: SETTINGS_SERVICE, useExisting: SettingsService },

        // Schema loader runs at onModuleInit when autoLoadSchema is on.
        SettingsSchemaLoader,

        // Broadcast listener runs at onApplicationBootstrap when
        // broadcasting is enabled.
        SettingsBroadcastListener,
      ],
      exports: [
        SETTINGS_CONFIG,
        SETTINGS_REGISTRY,
        SettingsRegistry,
        SETTINGS_MANAGER,
        SettingsStoreManager,
        SETTINGS_SERVICE,
        SettingsService,
        SettingsSchemaLoader,
      ],
    };
  }

  /**
   * Register with async configuration.
   *
   * @param options - Async factory options.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(options: IAsyncModuleOptions<ISettingsModuleOptions>): DynamicModule {
    return {
      module: SettingsModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: SETTINGS_CONFIG,
          useFactory: async (...args: unknown[]) => mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },

        SettingsRegistry,
        { provide: SETTINGS_REGISTRY, useExisting: SettingsRegistry },

        SettingsStoreManager,
        { provide: SETTINGS_MANAGER, useExisting: SettingsStoreManager },

        SettingsService,
        { provide: SETTINGS_SERVICE, useExisting: SettingsService },

        SettingsSchemaLoader,
        SettingsBroadcastListener,
      ],
      exports: [
        SETTINGS_CONFIG,
        SETTINGS_REGISTRY,
        SettingsRegistry,
        SETTINGS_MANAGER,
        SettingsStoreManager,
        SETTINGS_SERVICE,
        SettingsService,
        SettingsSchemaLoader,
      ],
    };
  }

  /**
   * Register client-declared DTO classes decorated with `@Setting()`.
   *
   * The DTOs are registered into the registry during
   * `onApplicationBootstrap` via a `createSeedLoader` pair, so no
   * side-effecting `useFactory` sentinel is needed.
   *
   * @param dtos - A single DTO or an array of DTOs.
   * @returns Dynamic module definition.
   */
  public static forFeature(dtos: Type | Type[]): DynamicModule {
    const list = Array.isArray(dtos) ? dtos : [dtos];
    const suffix = list.map((dto) => dto.name).join(",");

    return {
      module: SettingsModule,
      providers: [
        {
          provide: seedLoaderToken(`settings:forFeature:${suffix}`),
          useFactory: (registry: ISettingsRegistry) =>
            createSeedLoader(() => {
              for (const dto of list) registry.registerClass(dto);
            }),
          inject: [SETTINGS_REGISTRY],
        },
      ],
      exports: [],
    };
  }
}
