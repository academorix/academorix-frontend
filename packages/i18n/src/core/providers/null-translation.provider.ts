/**
 * @file null-translation.provider.ts
 * @module @stackra/i18n/core/providers
 * @description No-op reference implementation of `ITranslationProvider`.
 *   Returns the source text unchanged — used for testing and as a
 *   fallback when no machine-translation provider is configured.
 */

import type { ITranslationProvider } from '@stackra/contracts';

/**
 * Null translation provider — returns the source text unchanged.
 *
 * Used for testing and as a no-op fallback when no `ITranslationProvider`
 * is registered under `I18N_TRANSLATION_PROVIDER`.
 */
export class NullTranslationProvider implements ITranslationProvider {
  public getName(): string {
    return 'null';
  }

  public async translate(_key: string, text: string): Promise<string> {
    return text;
  }

  public async translateBatch(
    entries: ReadonlyArray<{ key: string; text: string }>
  ): Promise<string[]> {
    return entries.map((entry) => entry.text);
  }

  public supports(): boolean {
    return true;
  }
}
