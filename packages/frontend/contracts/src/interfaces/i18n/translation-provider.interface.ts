/**
 * @file translation-provider.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Contract for machine-translation providers.
 *
 *   Auto-translate missing keys via external services (AI models, Google
 *   Translate, SimpleLocalize, …). The contract lives in contracts;
 *   implementations live in external packages (e.g. `@stackra/ai`) so a
 *   consumer can register a provider under `I18N_TRANSLATION_PROVIDER`
 *   without either side depending on the other's runtime.
 */

/**
 * Machine-translation provider contract.
 */
export interface ITranslationProvider {
  /**
   * Provider identifier (e.g. `"ai"`, `"google"`, `"simplelocalize"`).
   */
  getName(): string;

  /**
   * Translate a single string.
   *
   * @param key - Translation key for context / caching.
   * @param text - Source text.
   * @param sourceLocale - Source language code.
   * @param targetLocale - Target language code.
   * @returns Translated text.
   * @throws When translation fails or the pair is unsupported.
   */
  translate(key: string, text: string, sourceLocale: string, targetLocale: string): Promise<string>;

  /**
   * Batch-translate multiple entries — more efficient than individual
   * calls and often yields better quality thanks to shared context.
   *
   * @param entries - `{ key, text }` pairs to translate.
   * @param sourceLocale - Source language code.
   * @param targetLocale - Target language code.
   * @returns Translated texts in the same order.
   */
  translateBatch(
    entries: ReadonlyArray<{ key: string; text: string }>,
    sourceLocale: string,
    targetLocale: string,
  ): Promise<string[]>;

  /**
   * Check if the provider supports a locale pair.
   *
   * @param sourceLocale - Source language code.
   * @param targetLocale - Target language code.
   * @returns `true` if supported.
   */
  supports(sourceLocale: string, targetLocale: string): boolean;
}
