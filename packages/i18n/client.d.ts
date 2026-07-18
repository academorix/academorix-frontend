/**
 * @file client.d.ts
 * @module @stackra/i18n/vite/client
 * @description Ambient type declarations for the `virtual:i18n/translations`
 *   module produced by {@link i18nPlugin}. Consumers reference this file
 *   from their `vite-env.d.ts`:
 *
 *   ```ts
 *   /// <reference types="@stackra/i18n/vite/client" />
 *   ```
 *
 *   Ships from the package root (mirrors `vite/client`) so the reference
 *   path is stable and doesn't require a subpath export.
 */

declare module 'virtual:i18n/translations' {
  /** Translations keyed by locale, then by namespace. */
  export const translations: Record<string, Record<string, Record<string, unknown>>>;
  /** Locale codes discovered under the configured `translationsDir`. */
  export const supportedLocales: string[];
}
