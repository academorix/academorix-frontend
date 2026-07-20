/**
 * @file i18n-loader.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Contract for translation loaders. Loaders are responsible
 *   for fetching translation data (static JSON, HTTP endpoints, filesystem,
 *   bundled assets). The engine is loader-agnostic — it calls `load()` and
 *   `languages()` without knowing where the data comes from.
 *
 *   Lives in contracts so external packages can author loaders and pass
 *   them to `II18nManager.loadNamespace(...)` without depending on the
 *   `@stackra/i18n` runtime.
 */

import type { I18nTranslation } from "./i18n-translation.type";

/**
 * Translation-loader contract.
 *
 * Each implementation is a different strategy for fetching translations.
 */
export interface II18nLoader {
  /**
   * Load translations for a specific locale.
   *
   * @param locale - Target locale code (e.g. `"en"`, `"ar"`).
   * @returns Translations object for the locale.
   */
  load(locale: string): Promise<I18nTranslation>;

  /**
   * List every locale the loader can serve.
   *
   * @returns Array of available locale codes.
   */
  languages(): Promise<string[]>;
}
