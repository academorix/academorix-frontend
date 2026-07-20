/**
 * @file use-i18n-return.interface.ts
 * @module @stackra/i18n/react/interfaces
 * @description Return type of `useI18n()`.
 */

import type { Path, TranslateOptions } from "@stackra/contracts";

/**
 * Return type of `useI18n()`.
 *
 * @typeParam K - Generated translations shape used to type-check keys.
 */
export interface UseI18nReturn<K = Record<string, unknown>> {
  /** Currently active locale code. */
  locale: string;
  /** Text direction for the current locale. */
  dir: "ltr" | "rtl";
  /** Whether the current locale is right-to-left. */
  isRTL: boolean;
  /** List of supported locale codes. */
  languages: string[];
  /** Switch to a different locale. */
  setLocale: (locale: string) => Promise<void>;
  /** Whether translations are loading. */
  isLoading: boolean;
  /**
   * Translate a key with type safety.
   *
   * @param key - Dot-separated translation key
   * @param options - Translation options (args, lang, defaultValue)
   * @returns The translated string
   */
  t: <P extends Path<K> = Path<K>>(key: P, options?: TranslateOptions) => string;
}
