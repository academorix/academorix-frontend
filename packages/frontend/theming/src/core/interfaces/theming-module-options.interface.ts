/**
 * @file theming-module-options.interface.ts
 * @module @stackra/theming/core/interfaces
 * @description Module options for `ThemingModule.forRoot(...)`.
 *
 *   Package-owned config shape. Consumers reach it through the
 *   `THEMING_CONFIG` token (declared in `@stackra/contracts`) — the
 *   token binds the shape, the shape lives with its owning package.
 *
 *   Matches the pattern used by every other `@stackra/*` module
 *   (cache, queue, events, ...): the token is cross-cutting and lives
 *   in contracts, the config-shape is package-owned.
 */

import type { ColorMode, ITheme } from "@stackra/contracts";

/**
 * Configuration for the theming module.
 */
export interface IThemingModuleOptions {
  /**
   * The default named theme to activate on first visit.
   * Must be a theme ID registered in the built-in set or via `forFeature()`.
   */
  readonly defaultTheme?: string;

  /**
   * The default color mode: 'light', 'dark', or 'system'.
   * 'system' follows the OS preference.
   */
  readonly defaultMode?: ColorMode;

  /**
   * Base URL for theme preview images (PNG avatars).
   * Apps copy assets/themes/*.png to public/ and point this here.
   */
  readonly avatarBaseUrl?: string;

  /**
   * Configure remote theme loading from a CMS or API.
   * When enabled, `ThemeApiService` fetches themes on bootstrap.
   */
  readonly api?: {
    /** Whether remote-theme loading is enabled. */
    readonly enabled: boolean;
    /** Base URL to POST/GET themes against. */
    readonly baseUrl?: string;
    /** Optional static JSON file URL to seed from at bootstrap. */
    readonly staticJson?: string;
  };

  /**
   * Storage keys for persisting user preferences.
   * Customise if your app uses a different key naming convention.
   */
  readonly persistence?: {
    /** localStorage/AsyncStorage key for the color mode. */
    readonly modeKey?: string;
    /** localStorage/AsyncStorage key for the theme id. */
    readonly themeKey?: string;
  };

  /**
   * Whether to emit events on state changes.
   * Disable in performance-critical scenarios.
   * @default true
   */
  readonly emitEvents?: boolean;

  /**
   * Enable scope-based theme resolution.
   * Different venues/tenants can have different brand themes.
   * @default false
   */
  readonly scopeAware?: boolean;

  /**
   * Additional themes to seed the registry with at bootstrap.
   * Merged with the built-in set.
   */
  readonly themes?: readonly ITheme[];
}
