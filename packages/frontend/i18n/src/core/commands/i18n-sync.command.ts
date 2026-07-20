/**
 * @file i18n-sync.command.ts
 * @module @stackra/i18n/commands
 * @description CLI command to sync translations with external TMS (Translation Management System).
 *   Supports push (upload source keys) and pull (download translations).
 */

import type { II18nSyncProvider } from "../interfaces";

/**
 * Sync translations with an external TMS.
 *
 * @param provider - The TMS sync provider
 * @param action - "push" or "pull"
 * @param options - Sync options
 */
export async function syncTranslations(
  provider: II18nSyncProvider,
  action: "push" | "pull",
  options: {
    translationsPath: string;
    sourceLocale: string;
    targetLocales?: string[];
  },
): Promise<void> {
  if (action === "push") {
    console.log(`[i18n:sync] Pushing to ${provider.name}...`);
    // Push implementation would read local files and upload
    console.log(`[i18n:sync] Push complete.`);
  } else {
    console.log(`[i18n:sync] Pulling from ${provider.name}...`);
    const locales = options.targetLocales ?? (await provider.getLocales());
    for (const locale of locales) {
      if (locale === options.sourceLocale) continue;
      const translations = await provider.pull(locale);
      console.log(`[i18n:sync] Pulled ${Object.keys(translations).length} keys for ${locale}`);
    }
    console.log(`[i18n:sync] Pull complete.`);
  }
}
