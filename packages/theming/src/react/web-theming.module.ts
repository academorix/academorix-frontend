/**
 * @file web-theming.module.ts
 * @module @stackra/theming/react
 * @description Web platform theming module.
 *   Imports ThemingModule.forRoot() and overrides THEME_BINDINGS with WebThemeBindings.
 */

import { Module, type DynamicModule } from '@stackra/container';
import { THEME_BINDINGS } from '@stackra/contracts';
import type { IThemingModuleOptions } from '../core/interfaces';
import { ThemingModule } from '../core/theming.module';
import { WebThemeBindings } from './bindings';

// ============================================================================
// Module
// ============================================================================

/**
 * Web platform theming module.
 *
 * Imports `ThemingModule.forRoot()` and overrides `THEME_BINDINGS` with
 * `WebThemeBindings` for localStorage persistence, DOM class toggling,
 * and matchMedia system detection.
 */
@Module({})
export class WebThemingModule {
  /**
   * Register the web theming system globally.
   *
   * @param options - Module configuration options.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: IThemingModuleOptions = {}): DynamicModule {
    return {
      module: WebThemingModule,
      global: true,
      imports: [ThemingModule.forRoot(options)],
      providers: [{ provide: THEME_BINDINGS, useClass: WebThemeBindings }],
      exports: [THEME_BINDINGS],
    };
  }
}
