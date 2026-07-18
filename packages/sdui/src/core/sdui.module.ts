/**
 * @file sdui.module.ts
 * @module @stackra/sdui/core
 * @description SduiModule — DI wiring for the SDUI runtime.
 *
 *   `forRoot(options)` returns providers + `useExisting` aliases + a
 *   `useValue` config only. Component / layout seeds happen via
 *   `createSeedLoader` from `@stackra/support` — no bootstrap classes,
 *   no sentinel-returning factories.
 */

import { Global, Module, type DynamicModule } from '@stackra/container';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';
import type { ISduiClient, ISduiModuleOptions } from '@stackra/contracts';
import {
  SDUI_CLIENT,
  SDUI_COMPONENT_REGISTRY,
  SDUI_CONFIG,
  SDUI_LAYOUT_REGISTRY,
  SDUI_PAGE_REGISTRY,
  SDUI_SCHEMA_CACHE,
  SDUI_SERVICE,
} from '@stackra/contracts';

import { ComponentRegistry, LayoutRegistry, SduiPageRegistry } from './registries';
import { NullSduiClient, SchemaCache, SduiService } from './services';

/**
 * SDUI configuration + client-slot options.
 *
 * `client` is not part of the public contract options interface
 * because the concrete `ISduiClient` is a runtime object, not a
 * serializable config — but consumers can supply one at boot to
 * override the {@link NullSduiClient} default.
 */
export interface ISduiForRootOptions extends ISduiModuleOptions {
  readonly client?: ISduiClient;
}

/**
 * SduiModule — DI wiring for the SDUI runtime.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     SduiModule.forRoot({
 *       baseUrl: '/api/sdui',
 *       cacheTtl: 3600,
 *       client: new HttpSduiClient(httpManager),
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class SduiModule {
  public static forRoot(options: ISduiForRootOptions = {}): DynamicModule {
    return {
      module: SduiModule,
      global: true,
      providers: [
        // Config
        { provide: SDUI_CONFIG, useValue: options },

        // Client — consumer-supplied or the null fallback
        options.client
          ? { provide: SDUI_CLIENT, useValue: options.client }
          : { provide: SDUI_CLIENT, useClass: NullSduiClient },

        // Registries
        ComponentRegistry,
        { provide: SDUI_COMPONENT_REGISTRY, useExisting: ComponentRegistry },
        LayoutRegistry,
        { provide: SDUI_LAYOUT_REGISTRY, useExisting: LayoutRegistry },
        SduiPageRegistry,
        { provide: SDUI_PAGE_REGISTRY, useExisting: SduiPageRegistry },

        // Cache + primary service
        SchemaCache,
        { provide: SDUI_SCHEMA_CACHE, useExisting: SchemaCache },
        SduiService,
        { provide: SDUI_SERVICE, useExisting: SduiService },

        // Cache TTL + consumer-supplied component/layout entries seeded via a lifecycle loader.
        {
          provide: seedLoaderToken('sdui:forRoot'),
          useFactory: (
            cache: SchemaCache,
            components: ComponentRegistry,
            layouts: LayoutRegistry
          ) =>
            createSeedLoader(() => {
              if (options.cacheTtl != null) cache.setTtlSeconds(options.cacheTtl);
              for (const [type, entry] of Object.entries(options.components ?? {})) {
                components.register(type, entry);
              }
              for (const layout of options.layouts ?? []) {
                layouts.register(layout.key, layout);
              }
            }),
          inject: [SchemaCache, ComponentRegistry, LayoutRegistry],
        },
      ],
      exports: [
        SDUI_CONFIG,
        SDUI_CLIENT,
        SDUI_COMPONENT_REGISTRY,
        SDUI_LAYOUT_REGISTRY,
        SDUI_PAGE_REGISTRY,
        SDUI_SCHEMA_CACHE,
        SDUI_SERVICE,
        ComponentRegistry,
        LayoutRegistry,
        SduiPageRegistry,
        SchemaCache,
        SduiService,
      ],
    };
  }

  /**
   * Register additional components / layouts via a lifecycle-safe loader.
   */
  public static forFeature(items: {
    components?: Readonly<Record<string, import('@stackra/contracts').ISduiComponentEntry>>;
    layouts?: readonly import('@stackra/contracts').ISduiLayoutEntry[];
  }): DynamicModule {
    return {
      module: SduiModule,
      providers: [
        {
          provide: seedLoaderToken('sdui:forFeature'),
          useFactory: (components: ComponentRegistry, layouts: LayoutRegistry) =>
            createSeedLoader(() => {
              for (const [type, entry] of Object.entries(items.components ?? {})) {
                components.register(type, entry);
              }
              for (const layout of items.layouts ?? []) {
                layouts.register(layout.key, layout);
              }
            }),
          inject: [ComponentRegistry, LayoutRegistry],
        },
      ],
      exports: [],
    };
  }
}
