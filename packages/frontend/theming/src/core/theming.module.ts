/**
 * @file theming.module.ts
 * @module @stackra/theming
 * @description DI module for the theming system.
 *   Provides forRoot(), forRootAsync(), and forFeature() static methods.
 */

import { Module, type DynamicModule } from '@stackra/container';
import type { ITheme } from '@stackra/contracts';
import {
  THEME_BINDINGS,
  THEMING_CONFIG,
  THEME_REGISTRY,
  THEME_SERVICE,
} from '@stackra/contracts';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';
import type { IThemingModuleOptions } from './interfaces';
import { THEME_TOKEN_STORE } from './tokens';
import { NullThemeBindings } from './bindings';
import { ThemeRegistry } from './registries';
import { ThemeTokenStore } from './stores';
import { ThemeService } from './services';
import { ThemeApiService } from './services';

// ============================================================================
// Module
// ============================================================================

/**
 * Theming DI module.
 *
 * Provides `forRoot()` for global configuration, `forRootAsync()` for
 * factory-based config, and `forFeature()` for adding theme presets at runtime.
 */
@Module({})
export class ThemingModule {
  /**
   * Register the theming system globally.
   * Seeds built-in presets, registers core services, and binds NullThemeBindings.
   *
   * @param options - Module configuration options.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: IThemingModuleOptions = {}): DynamicModule {
    return {
      module: ThemingModule,
      global: true,
      providers: [
        { provide: THEMING_CONFIG, useValue: options },
        { provide: THEME_BINDINGS, useClass: NullThemeBindings },
        { provide: THEME_REGISTRY, useClass: ThemeRegistry },
        { provide: THEME_TOKEN_STORE, useClass: ThemeTokenStore },
        { provide: THEME_SERVICE, useClass: ThemeService },
        ThemeApiService,
      ],
      exports: [
        THEMING_CONFIG,
        THEME_BINDINGS,
        THEME_REGISTRY,
        THEME_TOKEN_STORE,
        THEME_SERVICE,
        ThemeApiService,
      ],
    };
  }

  /**
   * Factory-based configuration for async environments.
   *
   * @param options - Factory and inject configuration.
   * @returns Dynamic module definition.
   */
  public static forRootAsync(options: {
    useFactory: (...args: any[]) => IThemingModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: ThemingModule,
      global: true,
      providers: [
        {
          provide: THEMING_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        { provide: THEME_BINDINGS, useClass: NullThemeBindings },
        { provide: THEME_REGISTRY, useClass: ThemeRegistry },
        { provide: THEME_TOKEN_STORE, useClass: ThemeTokenStore },
        { provide: THEME_SERVICE, useClass: ThemeService },
        ThemeApiService,
      ],
      exports: [
        THEMING_CONFIG,
        THEME_BINDINGS,
        THEME_REGISTRY,
        THEME_TOKEN_STORE,
        THEME_SERVICE,
        ThemeApiService,
      ],
    };
  }

  /**
   * Register additional theme presets at runtime.
   * Called by feature modules to extend the theme catalog.
   *
   * @param themes - Array of theme configs to register.
   * @returns Dynamic module definition.
   */
  public static forFeature(themes: ITheme[]): DynamicModule {
    return {
      module: ThemingModule,
      providers: [
        {
          // Unique seed-loader token per `forFeature` call. The container is
          // last-wins per token, so a shared token would drop every contribution
          // but the last — `seedLoaderToken(...)` returns a fresh Symbol().
          provide: seedLoaderToken('theming:forFeature'),
          useFactory: (registry: ThemeRegistry) =>
            createSeedLoader(() => {
              // Seeding happens at OnApplicationBootstrap (after every module's
              // OnModuleInit) — safe to append into an already-populated registry.
              for (const theme of themes) {
                if (!registry.has(theme.id)) {
                  registry.register(theme.id, theme);
                }
              }
            }),
          inject: [THEME_REGISTRY],
        },
      ],
    };
  }
}
