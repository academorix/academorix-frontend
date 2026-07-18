/**
 * @file theming.config.ts
 * @module @stackra/theming/config
 * @description App-level configuration template for the theming module.
 *   Import this pattern in your app's config/ folder.
 */

import { defineConfig } from '@stackra/theming';

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Theme
  |--------------------------------------------------------------------------
  |
  | The default named theme to activate on first visit.
  | Must be a theme ID registered in the built-in set or via forFeature().
  |
  */
  defaultTheme: 'default',

  /*
  |--------------------------------------------------------------------------
  | Default Color Mode
  |--------------------------------------------------------------------------
  |
  | The default color mode: 'light', 'dark', or 'system'.
  | 'system' follows the OS preference.
  |
  */
  defaultMode: 'system',

  /*
  |--------------------------------------------------------------------------
  | Avatar Base URL
  |--------------------------------------------------------------------------
  |
  | Base URL for theme preview images (PNG avatars).
  | Apps copy assets/themes/*.png to public/ and point this here.
  |
  */
  avatarBaseUrl: '/themes',

  /*
  |--------------------------------------------------------------------------
  | Remote API
  |--------------------------------------------------------------------------
  |
  | Configure remote theme loading from a CMS or API.
  | When enabled, ThemeApiService fetches themes on bootstrap.
  |
  */
  api: {
    enabled: false,
    baseUrl: '/api/themes',
  },

  /*
  |--------------------------------------------------------------------------
  | Persistence
  |--------------------------------------------------------------------------
  |
  | Storage keys for persisting user preferences.
  | Customize if your app uses a different key naming convention.
  |
  */
  persistence: {
    modeKey: 'stackra-color-mode',
    themeKey: 'stackra-theme',
  },

  /*
  |--------------------------------------------------------------------------
  | Event Emission
  |--------------------------------------------------------------------------
  |
  | Whether to emit events on state changes.
  | Disable in performance-critical scenarios.
  |
  */
  emitEvents: true,

  /*
  |--------------------------------------------------------------------------
  | Scope-Aware
  |--------------------------------------------------------------------------
  |
  | Enable scope-based theme resolution.
  | Different venues/tenants can have different brand themes.
  |
  */
  scopeAware: false,
});
