/**
 * @file i18n-sync-provider.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description II18nSyncProvider interface.
 */

/**
 * Sync provider interface — implemented by TMS integrations.
 */
export interface II18nSyncProvider {
  /** Provider name (e.g., "simplelocalize", "crowdin", "lokalise"). */
  name: string;
  /** Push source translations to the TMS. */
  push(keys: Record<string, string>, sourceLocale: string): Promise<void>;
  /** Pull translations for a target locale from the TMS. */
  pull(targetLocale: string): Promise<Record<string, string>>;
  /** Get available locales from the TMS. */
  getLocales(): Promise<string[]>;
}
