/**
 * @file use-locale-return.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description UseLocaleReturn interface.
 */

/**
 * Return type of `useLocale()`.
 */
export interface UseLocaleReturn {
  /** Currently active locale code. */
  locale: string;
  /** Text direction for the current locale. */
  dir: 'ltr' | 'rtl';
  /** Whether the current locale is RTL. */
  isRTL: boolean;
  /** Switch to a different locale. */
  setLocale: (locale: string) => Promise<void>;
  /** Supported locale codes. */
  languages: string[];
}
