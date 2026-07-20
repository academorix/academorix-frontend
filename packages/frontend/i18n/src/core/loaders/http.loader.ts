/**
 * @file http.loader.ts
 * @module @stackra/i18n/core/loaders
 * @description Loads translations from a remote HTTP endpoint at runtime.
 *   Suitable for CMS-managed translations or external TMS integrations.
 */

import type { II18nLoader, I18nTranslation } from '@stackra/contracts';

import type { HttpLoaderOptions } from '../interfaces';

/**
 * Loads translations from a remote HTTP endpoint.
 * Results are cached per locale. Call `clearCache()` to force re-fetch.
 */
export class HttpLoader implements II18nLoader {
  private readonly urlPattern: string;
  private readonly languagesUrl?: string;
  private readonly supportedLocales: string[];
  private readonly fetchOptions: RequestInit;
  private readonly cache = new Map<string, I18nTranslation>();

  public constructor(options?: unknown) {
    const opts = (options ?? {}) as HttpLoaderOptions;
    this.urlPattern = opts.urlPattern ?? '/i18n/{locale}.json';
    this.languagesUrl = opts.languagesUrl;
    this.supportedLocales = opts.supportedLocales ?? [];
    this.fetchOptions = opts.fetchOptions ?? {};
  }

  public async load(locale: string): Promise<I18nTranslation> {
    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }

    const url = this.urlPattern.replace('{locale}', locale);

    try {
      const response = await fetch(url, this.fetchOptions);
      if (!response.ok) return {};

      const translations = (await response.json()) as I18nTranslation;
      this.cache.set(locale, translations);
      return translations;
    } catch {
      return {};
    }
  }

  public async languages(): Promise<string[]> {
    if (!this.languagesUrl) {
      return [...this.supportedLocales];
    }

    try {
      const response = await fetch(this.languagesUrl, this.fetchOptions);
      if (!response.ok) return [...this.supportedLocales];
      return (await response.json()) as string[];
    } catch {
      return [...this.supportedLocales];
    }
  }

  /** Clear the cache for a specific locale or all. */
  public clearCache(locale?: string): void {
    if (locale) this.cache.delete(locale);
    else this.cache.clear();
  }
}
