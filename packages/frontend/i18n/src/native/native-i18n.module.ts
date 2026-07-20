/**
 * @file native-i18n.module.ts
 * @module @stackra/i18n/native
 * @description React Native composition of `I18nModule.forRoot()` with
 *   the React Native direction adapter registered under
 *   `I18N_DIRECTION_ADAPTER`.
 *
 *   Locale persistence is now handled by the core `I18nModule.forRoot`
 *   via the `storage` config field (delegated to `@stackra/storage`).
 *   This module is a thin composition that only adds the RN direction
 *   adapter on top of the core module.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { I18N_DIRECTION_ADAPTER } from "@stackra/contracts";

import type { II18nConfig } from "../core/interfaces";
import { I18nModule } from "../core/i18n.module";
import { NativeDirectionAdapter } from "./adapters/native-direction.adapter";

/**
 * Native i18n module.
 *
 * Imports the platform-agnostic `I18nModule.forRoot(config)` and layers
 * on the React Native direction adapter. Locale storage is delegated
 * to `@stackra/storage` — set `storage: 'asyncStorage'` on the config
 * and import `NativeStorageModule.forRoot(...)` upstream.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     NativeStorageModule.forRoot({
 *       default: 'asyncStorage',
 *       stores: { asyncStorage: { driver: 'asyncStorage' } },
 *     }),
 *     NativeI18nModule.forRoot({
 *       defaultLocale: 'en',
 *       supportedLocales: ['en', 'ar'],
 *       loader: StaticLoader,
 *       loaderOptions: { translations },
 *       storage: 'asyncStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NativeI18nModule {
  /**
   * Compose `I18nModule.forRoot(config)` with the RN direction adapter.
   *
   * @param config - Partial i18n configuration.
   * @returns Dynamic module definition.
   */
  public static forRoot(config: Partial<II18nConfig> = {}): DynamicModule {
    return {
      module: NativeI18nModule,
      global: true,
      imports: [I18nModule.forRoot(config)],
      providers: [
        NativeDirectionAdapter,
        { provide: I18N_DIRECTION_ADAPTER, useExisting: NativeDirectionAdapter },
      ],
      exports: [I18N_DIRECTION_ADAPTER],
    };
  }
}
