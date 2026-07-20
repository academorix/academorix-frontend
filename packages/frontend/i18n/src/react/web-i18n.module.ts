/**
 * @file web-i18n.module.ts
 * @module @stackra/i18n/react
 * @description Web-platform composition of `I18nModule.forRoot()` with
 *   the browser DOM direction adapter registered under
 *   `I18N_DIRECTION_ADAPTER`.
 *
 *   Locale persistence is now handled by the core `I18nModule.forRoot`
 *   via the `storage` config field (delegated to `@stackra/storage`).
 *   This module is a thin composition that only adds the DOM direction
 *   adapter on top of the core module.
 */

import { Module, type DynamicModule } from '@stackra/container';
import { I18N_DIRECTION_ADAPTER } from '@stackra/contracts';

import type { II18nConfig } from '../core/interfaces';
import { I18nModule } from '../core/i18n.module';
import { WebDirectionAdapter } from './adapters/web-direction.adapter';

/**
 * Web i18n module.
 *
 * Imports the platform-agnostic `I18nModule.forRoot(config)` and layers
 * on the DOM direction adapter. Locale storage is delegated to
 * `@stackra/storage` — set `storage: '<instance>'` on the config.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage' } },
 *     }),
 *     WebI18nModule.forRoot({
 *       defaultLocale: 'en',
 *       supportedLocales: ['en', 'ar'],
 *       loader: StaticLoader,
 *       loaderOptions: { translations },
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebI18nModule {
  /**
   * Compose `I18nModule.forRoot(config)` with the DOM direction adapter.
   *
   * @param config - Partial i18n configuration (merged in `I18nModule.forRoot`).
   * @returns Dynamic module definition.
   */
  public static forRoot(config: Partial<II18nConfig> = {}): DynamicModule {
    return {
      module: WebI18nModule,
      global: true,
      imports: [I18nModule.forRoot(config)],
      providers: [
        WebDirectionAdapter,
        { provide: I18N_DIRECTION_ADAPTER, useExisting: WebDirectionAdapter },
      ],
      exports: [I18N_DIRECTION_ADAPTER],
    };
  }
}
