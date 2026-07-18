/**
 * @file i18n-manager.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Public contract of the translation engine.
 *
 *   Lives in contracts so cross-package consumers (`@stackra/http`,
 *   `@stackra/ai`, `@stackra/ssr`, …) can inject `I18N_MANAGER` and type
 *   against a single source of truth without depending on the
 *   `@stackra/i18n` runtime.
 */

import type { II18nLoader } from "./i18n-loader.interface";
import type { I18nTranslation } from "./i18n-translation.type";
import type { TranslationPath } from "./path.type";
import type { TranslateOptions } from "./translate-options.interface";

/**
 * Translation-engine contract.
 *
 * `I18nManager` owns the translation store, the current locale, and the
 * key-resolution pipeline (namespace + dot-path + pluralisation +
 * interpolation).
 *
 * @typeParam K - The translations shape used to type-check keys. Defaults
 *   to `Record<string, unknown>` for untyped consumers.
 */
export interface II18nManager<K = Record<string, unknown>> {
  /** Translate a key to the active (or overridden) locale. */
  translate<P extends TranslationPath<K> = TranslationPath<K>>(
    key: P,
    options?: TranslateOptions,
  ): string;

  /** Shorthand alias for `translate()`. */
  t<P extends TranslationPath<K> = TranslationPath<K>>(key: P, options?: TranslateOptions): string;

  /** List of supported language codes. */
  getSupportedLanguages(): string[];

  /** Every loaded translation record, keyed by locale. */
  getTranslations(): Record<string, I18nTranslation>;

  /** Currently active locale. */
  getCurrentLocale(): string;

  /**
   * Switch the current locale and eagerly load its translations.
   *
   * @param locale - Target locale code.
   */
  setCurrentLocale(locale: string): Promise<void>;

  /** Refresh every locale via the configured loader. */
  refresh(): Promise<void>;

  /** Load translations for a single locale via the configured loader. */
  loadLocale(locale: string): Promise<void>;

  /** Set translations directly (bypasses the loader). */
  setTranslations(translations: Record<string, I18nTranslation>, languages: string[]): void;

  /** Merge namespace-scoped translations for many locales at once. */
  mergeTranslations(
    namespace: string,
    localeTranslations: Record<string, Record<string, unknown>>,
  ): void;

  /** Load translations for a namespace using a separate loader. */
  loadNamespace(namespace: string, loader: II18nLoader): Promise<void>;
}
