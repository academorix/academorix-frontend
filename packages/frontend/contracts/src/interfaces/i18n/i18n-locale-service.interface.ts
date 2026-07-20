/**
 * @file i18n-locale-service.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Public contract of the locale-orchestrator service.
 *
 *   Lives in contracts so cross-package consumers (`@stackra/http`
 *   locale-header middleware, `@stackra/analytics` locale tagging,
 *   `@stackra/monitoring` locale-scoped errors, …) inject
 *   `I18N_LOCALE_SERVICE` and type against a single source of truth.
 */

/**
 * Locale-orchestrator contract.
 *
 * `I18nLocaleService` combines the manager, direction service, and storage
 * adapter into a single reactive locale-switching surface consumed by
 * hooks (`useLocale`, `useI18n`, `useDirection`) and by cross-package
 * consumers that need the current locale.
 */
export interface II18nLocaleService {
  /** Currently active locale code. */
  getLocale(): string;

  /** Text direction for the current locale. */
  getDir(): "ltr" | "rtl";

  /** Whether the current locale is right-to-left. */
  isRTL(): boolean;

  /** Copy of the configured supported-locale array. */
  getSupportedLocales(): string[];

  /**
   * Switch to a new locale — validates, persists, applies direction, loads
   * translations, and notifies subscribers.
   *
   * @param locale - Target locale code.
   * @returns `true` when a restart is needed (native direction change).
   * @throws When the locale is not supported.
   */
  setLocale(locale: string): Promise<boolean>;

  /**
   * Read the persisted locale from storage (used on init).
   *
   * @returns Stored locale, or `null` when unavailable or unsupported.
   */
  getPersistedLocale(): Promise<string | null>;

  /**
   * Subscribe to locale changes. Compatible with `useSyncExternalStore`.
   *
   * @param listener - Callback invoked with the new locale after every switch.
   * @returns Unsubscribe function.
   */
  subscribe(listener: (locale: string) => void): () => void;

  /** Current stable snapshot for `useSyncExternalStore`. */
  getSnapshot(): string;
}
