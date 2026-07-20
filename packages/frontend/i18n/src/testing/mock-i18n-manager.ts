/**
 * @file mock-i18n-manager.ts
 * @module @stackra/i18n/testing
 * @description In-memory `II18nManager` implementation for tests.
 *
 *   Bypasses the real interpolation/plural/loader pipeline in favour of
 *   deterministic key echoing (returns `namespace.key`), which is the
 *   right shape for asserting *that* a translate call happened without
 *   asserting on the rendered text. Individual tests can seed
 *   translations via `setTranslations` to exercise the full pipeline.
 */

import type {
  II18nLoader,
  II18nManager,
  I18nTranslation,
  TranslationPath,
  TranslateOptions,
} from "@stackra/contracts";

/**
 * In-memory translation engine — records every translate call so tests
 * can assert on the invocation sequence via
 * `mock.$.wasCalledWith('translate', ...)`.
 */
export class MockI18nManager<K = Record<string, unknown>> implements II18nManager<K> {
  private currentLocale: string;
  private readonly supportedLocales: string[];
  private translations: Record<string, I18nTranslation> = {};

  /** Every translate call, in order (key + resolved lang + options). */
  public readonly calls: Array<{ key: string; lang: string; options?: TranslateOptions }> = [];

  public constructor(options?: {
    defaultLocale?: string;
    supportedLocales?: string[];
    translations?: Record<string, I18nTranslation>;
  }) {
    this.currentLocale = options?.defaultLocale ?? "en";
    this.supportedLocales = options?.supportedLocales ?? [this.currentLocale];
    this.translations = options?.translations ?? {};
  }

  public translate<P extends TranslationPath<K> = TranslationPath<K>>(
    key: P,
    options?: TranslateOptions,
  ): string {
    const lang = options?.lang ?? this.currentLocale;
    this.calls.push({ key: key as string, lang, options });

    // Simple dot-path lookup — no interpolation. If the resolved value
    // is a string return it, otherwise echo the key.
    const table = this.translations[lang];
    if (!table) return options?.defaultValue ?? (key as string);

    const parts = (key as string).split(".");
    let node: unknown = table;
    for (const part of parts) {
      if (typeof node !== "object" || node === null)
        return options?.defaultValue ?? (key as string);
      node = (node as Record<string, unknown>)[part];
    }
    return typeof node === "string" ? node : (options?.defaultValue ?? (key as string));
  }

  public t<P extends TranslationPath<K> = TranslationPath<K>>(
    key: P,
    options?: TranslateOptions,
  ): string {
    return this.translate(key, options);
  }

  public getSupportedLanguages(): string[] {
    return [...this.supportedLocales];
  }

  public getTranslations(): Record<string, I18nTranslation> {
    return { ...this.translations };
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  public async setCurrentLocale(locale: string): Promise<void> {
    this.currentLocale = locale;
  }

  public async refresh(): Promise<void> {
    /* no-op */
  }

  public async loadLocale(_locale: string): Promise<void> {
    /* no-op */
  }

  public setTranslations(translations: Record<string, I18nTranslation>): void {
    this.translations = { ...translations };
  }

  public mergeTranslations(
    namespace: string,
    localeTranslations: Record<string, Record<string, unknown>>,
  ): void {
    for (const [locale, table] of Object.entries(localeTranslations)) {
      this.translations[locale] = {
        ...(this.translations[locale] ?? {}),
        [namespace]: table as I18nTranslation[string],
      };
    }
  }

  public async loadNamespace(_namespace: string, _loader: II18nLoader): Promise<void> {
    /* no-op */
  }

  /** Reset the recorded call ledger — useful between tests in a shared block. */
  public reset(): void {
    this.calls.length = 0;
  }
}
