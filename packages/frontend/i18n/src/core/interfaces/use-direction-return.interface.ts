/**
 * @file use-direction-return.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description UseDirectionReturn interface.
 */

/**
 * Return type of `useDirection()`.
 */
export interface UseDirectionReturn {
  /** Current text direction ('ltr' or 'rtl'). */
  dir: 'ltr' | 'rtl';
  /** Whether the current locale is right-to-left. */
  isRTL: boolean;
  /** The current locale code. */
  locale: string;
}
