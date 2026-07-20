/**
 * @file i18n-state.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Reactive i18n state shape managed by `@stackra/react-state`.
 *
 *   This state is:
 *   - Cross-tab synced (web) via BroadcastChannel
 *   - Persisted to storage (localStorage on web, AsyncStorage on native)
 *   - Subscribed by `useI18n()`, `useLocale()`, `useDirection()` hooks
 *   - Updated by `I18nLocaleService.setLocale()`
 */

/**
 * Reactive i18n state — the single source of truth for locale and direction.
 *
 * Managed by `@stackra/react-state` store. All hooks subscribe to
 * slices of this state for fine-grained re-renders.
 */
export interface II18nState {
  /** The currently active locale code (e.g., "en", "ar"). */
  locale: string;

  /** Text direction for the current locale ('ltr' or 'rtl'). */
  dir: 'ltr' | 'rtl';

  /** Whether a locale switch is in progress (translations loading). */
  isLoading: boolean;

  /** List of supported locale codes configured at init. */
  supportedLocales: string[];
}
