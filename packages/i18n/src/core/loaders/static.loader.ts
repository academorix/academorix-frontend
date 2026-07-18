/**
 * @file static.loader.ts
 * @module @stackra/i18n/core/loaders
 * @description Loads translations from a pre-bundled in-memory object.
 *   Zero network requests — translations are already available at config time.
 */

import type { II18nLoader, I18nTranslation } from '@stackra/contracts';

import type { StaticLoaderOptions } from '../interfaces';

/**
 * Loads translations from a static in-memory object.
 * Used when translations are bundled at build time (Vite virtual modules, direct imports).
 */
export class StaticLoader implements II18nLoader {
  private readonly translations: Record<string, I18nTranslation>;

  public constructor(options?: unknown) {
    const opts = (options ?? {}) as StaticLoaderOptions;
    this.translations = opts.translations ?? {};
  }

  public async load(locale: string): Promise<I18nTranslation> {
    return this.translations[locale] ?? {};
  }

  public async languages(): Promise<string[]> {
    return Object.keys(this.translations);
  }
}
