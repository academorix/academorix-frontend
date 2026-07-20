/**
 * @file native-theming.module.ts
 * @module @stackra/theming/native
 * @description Native platform theming module.
 *   Imports ThemingModule.forRoot() and overrides THEME_BINDINGS with NativeThemeBindings.
 */

import { Module, type DynamicModule } from "@stackra/container";
import { THEME_BINDINGS } from "@stackra/contracts";
import type { IThemingModuleOptions } from "../core/interfaces";
import { ThemingModule } from "../core/theming.module";
import { NativeThemeBindings } from "./bindings";

// ============================================================================
// Module
// ============================================================================

/**
 * Native platform theming module.
 *
 * Imports `ThemingModule.forRoot()` and overrides `THEME_BINDINGS` with
 * `NativeThemeBindings` for AsyncStorage persistence and Appearance API detection.
 */
@Module({})
export class NativeThemingModule {
  /**
   * Register the native theming system globally.
   *
   * @param options - Module configuration options.
   * @returns Dynamic module definition.
   */
  public static forRoot(options: IThemingModuleOptions = {}): DynamicModule {
    return {
      module: NativeThemingModule,
      global: true,
      imports: [ThemingModule.forRoot(options)],
      providers: [{ provide: THEME_BINDINGS, useClass: NativeThemeBindings }],
      exports: [THEME_BINDINGS],
    };
  }
}
