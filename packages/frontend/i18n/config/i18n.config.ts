/**
 * @file i18n.config.ts
 * @module @stackra/i18n/config
 * @description Application-level internationalization configuration.
 *   Consumed by `I18nModule.forRoot()` at bootstrap.
 */

import { defineConfig } from '@stackra/i18n';

export const i18nConfig = defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Default Locale
  |--------------------------------------------------------------------------
  |
  | The default locale used when no locale is detected from the user's
  | browser, device settings, or request headers.
  |
  */
  defaultLocale: 'en',

  /*
  |--------------------------------------------------------------------------
  | Fallback Locale
  |--------------------------------------------------------------------------
  |
  | When a translation key is missing in the active locale, this fallback
  | locale is tried before returning the key itself.
  |
  */
  fallbackLocale: 'en',

  /*
  |--------------------------------------------------------------------------
  | Supported Locales
  |--------------------------------------------------------------------------
  |
  | List of locales your application supports. Used for locale detection
  | validation and URL prefix generation.
  |
  */
  supportedLocales: ['en', 'ar'],

  /*
  |--------------------------------------------------------------------------
  | RTL Locales
  |--------------------------------------------------------------------------
  |
  | Locales that use right-to-left text direction. The UI system uses this
  | to automatically flip layouts and apply RTL-specific styles.
  |
  */
  rtlLocales: ['ar', 'he', 'fa', 'ur'],

  /*
  |--------------------------------------------------------------------------
  | Translation Loader
  |--------------------------------------------------------------------------
  |
  | How translations are loaded. Options:
  |   - "static"  — bundled with the app (import JSON at build time)
  |   - "http"    — fetched from a remote endpoint at runtime
  |   - "bundled" — React Native bundled assets
  |
  */
  loader: 'static',

  /*
  |--------------------------------------------------------------------------
  | Missing Key Behavior
  |--------------------------------------------------------------------------
  |
  | What to return when a translation key is not found:
  |   - "key"     — return the key itself (e.g., "auth.login.title")
  |   - "empty"   — return an empty string
  |   - "throw"   — throw an error (development only)
  |
  */
  missingKeyBehavior: 'key',

  /*
  |--------------------------------------------------------------------------
  | Interpolation
  |--------------------------------------------------------------------------
  |
  | The delimiter pattern used for variable interpolation in translations.
  | Default uses double curly braces: "Hello {{name}}".
  |
  */
  interpolation: {
    prefix: '{{',
    suffix: '}}',
  },
});
