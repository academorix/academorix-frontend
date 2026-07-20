/**
 * @file dynamic-import.loader.ts
 * @module @stackra/i18n/core/loaders
 * @description Loads translations via dynamic import() for per-locale code-splitting.
 *   Each locale becomes a separate chunk — only the active locale is loaded.
 */

import type { II18nLoader, I18nTranslation } from "@stackra/contracts";

import type { DynamicImportLoaderOptions } from "../interfaces";

/**
 * Loads translations via dynamic import() for code-splitting.
 * Each locale is a separate chunk. Results are cached after first load.
 */
export class DynamicImportLoader implements II18nLoader {
  private readonly importFn: (locale: string) => Promise<unknown>;
  private readonly supportedLocales: string[];
  private readonly cache = new Map<string, I18nTranslation>();

  public constructor(options?: unknown) {
    const opts = (options ?? {}) as DynamicImportLoaderOptions;
    this.importFn = opts.importFn ?? (() => Promise.resolve({}));
    this.supportedLocales = opts.supportedLocales ?? [];
  }

  public async load(locale: string): Promise<I18nTranslation> {
    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }

    try {
      const module = await this.importFn(locale);
      const translations =
        module && typeof module === "object" && "default" in module
          ? (module as { default: I18nTranslation }).default
          : (module as I18nTranslation);

      this.cache.set(locale, translations);
      return translations;
    } catch {
      return {};
    }
  }

  public async languages(): Promise<string[]> {
    return [...this.supportedLocales];
  }

  /** Clear the cache for a specific locale or all. */
  public clearCache(locale?: string): void {
    if (locale) this.cache.delete(locale);
    else this.cache.clear();
  }
}
