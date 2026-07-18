/**
 * @file i18n.module.ts
 * @module @stackra/i18n/core
 * @description Core i18n DI module — wires the translation engine, locale
 *   orchestrator, and direction service.
 *
 *   ## Module hierarchy
 *
 *   ```
 *   I18nModule.forRoot(config)          ← core (platform-agnostic)
 *       │
 *       ├── WebI18nModule.forRoot(config)     ← binds DOM direction adapter
 *       └── NativeI18nModule.forRoot(config)  ← binds RN direction adapter
 *   ```
 *
 *   Locale persistence is delegated to `@stackra/storage`: set
 *   `storage: '<instance>'` on the config and the core module binds
 *   `StorageBackedLocaleAdapter` under `I18N_LOCALE_STORAGE`.
 *   When the field is omitted, no persistence is wired and the
 *   `I18nLocaleService`'s `@Optional() @Inject(I18N_LOCALE_STORAGE)`
 *   receives `undefined` — no-op semantics.
 *
 *   Post-wire coordination (manager ↔ locale-service, hydration of the
 *   persisted locale) lives inside the services themselves via
 *   `OnModuleInit` / `OnApplicationBootstrap` — the module does NOT
 *   implement lifecycle hooks and holds no runtime state.
 */

import { Module, type DynamicModule, type Provider } from '@stackra/container';
import {
  I18N_LOCALE_SERVICE,
  I18N_LOCALE_STORAGE,
  I18N_MANAGER,
  I18N_DIRECTION_SERVICE,
} from '@stackra/contracts';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';

import { StorageBackedLocaleAdapter } from './adapters/storage-backed-locale.adapter';
import { I18N_CONFIG } from './constants';
import type { II18nConfig, I18nFeatureOptions } from './interfaces';
import { I18nManager } from './services/i18n-manager.service';
import { I18nLocaleService } from './services/i18n-locale.service';
import { DirectionService } from './services/direction.service';
import { mergeConfig } from './utils/merge-config.util';

/**
 * Decide whether the caller opted into durable locale persistence.
 * `undefined` and `'memory'` both mean "no persistence".
 */
function needsStorageBacking(storage: II18nConfig['storage']): boolean {
  return !!storage && storage !== 'memory';
}

/**
 * Producer for the `I18N_LOCALE_STORAGE` provider — bound only when
 * the caller set `storage: '<instance>'` on the config. Otherwise
 * the token stays unbound and the locale service's `@Optional`
 * injection resolves to `undefined`.
 */
function localeStorageProvider(config: Partial<II18nConfig>): Provider[] {
  if (!needsStorageBacking(config.storage)) return [];
  return [{ provide: I18N_LOCALE_STORAGE, useClass: StorageBackedLocaleAdapter }];
}

/**
 * Core i18n DI module.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     WebStorageModule.forRoot({
 *       default: 'localStorage',
 *       stores: { localStorage: { driver: 'localStorage' } },
 *     }),
 *     I18nModule.forRoot({
 *       defaultLocale: 'en',
 *       supportedLocales: ['en', 'ar'],
 *       loader: StaticLoader,
 *       loaderOptions: { translations: { en, ar } },
 *       storage: 'localStorage',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class I18nModule {
  /**
   * Register the i18n module globally.
   *
   * @param options - Partial configuration merged over `DEFAULT_I18N_CONFIG`
   *   via `mergeConfig`. A missing `supportedLocales` defaults to
   *   `[defaultLocale]`.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: Partial<II18nConfig> = {}): DynamicModule {
    const config = mergeConfig(options);

    return {
      module: I18nModule,
      global: true,
      providers: [
        { provide: I18N_CONFIG, useValue: config },

        DirectionService,
        { provide: I18N_DIRECTION_SERVICE, useExisting: DirectionService },

        I18nManager,
        { provide: I18N_MANAGER, useExisting: I18nManager },

        I18nLocaleService,
        { provide: I18N_LOCALE_SERVICE, useExisting: I18nLocaleService },

        // Storage-backed locale adapter — bound conditionally based
        // on `options.storage`. Omitted means no persistence.
        ...localeStorageProvider(options),
      ],
      exports: [
        I18N_CONFIG,
        I18N_MANAGER,
        I18N_LOCALE_SERVICE,
        I18N_DIRECTION_SERVICE,
        I18nManager,
        I18nLocaleService,
        DirectionService,
      ],
    };
  }

  /**
   * Register namespace-scoped translations for a lazy-loaded feature.
   *
   * Uses the canonical `createSeedLoader` from `@stackra/support` so the
   * seeding side effect runs after every module has finished `onModuleInit`
   * — no `return null`/`true` sentinel factory (per the module-lifecycle
   * rule).
   *
   * @param options - Feature configuration (namespace + loader/translations).
   * @returns Dynamic module definition.
   */
  public static forFeature(options: I18nFeatureOptions): DynamicModule {
    return {
      module: I18nModule,
      providers: [
        {
          // Fresh, unique symbol per call — the container is last-wins per
          // token, so a shared token would drop every contribution but the
          // last.
          provide: seedLoaderToken(`i18n:${options.namespace}`),
          useFactory: (manager: I18nManager) =>
            createSeedLoader(async () => {
              const { namespace, loader: LoaderClass, loaderOptions, translations } = options;

              if (translations) {
                manager.mergeTranslations(namespace, translations);
              }

              if (LoaderClass) {
                const loader = new LoaderClass(loaderOptions);
                await manager.loadNamespace(namespace, loader);
              }
            }),
          inject: [I18N_MANAGER],
        },
      ],
    };
  }
}
