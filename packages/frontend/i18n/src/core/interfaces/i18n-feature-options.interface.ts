/**
 * @file i18n-feature-options.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Options accepted by `I18nModule.forFeature()` — namespace-
 *   scoped translations registered lazily via a `createSeedLoader`.
 */

import type { II18nLoader } from '@stackra/contracts';

/**
 * Options for a lazy-loaded translation namespace.
 */
export interface I18nFeatureOptions {
  /** Namespace prefix (e.g. `"checkout"`). */
  readonly namespace: string;

  /** Loader class used to fetch namespace translations at bootstrap. */
  readonly loader?: { new (...args: any[]): II18nLoader };

  /** Constructor argument passed to the loader class. */
  readonly loaderOptions?: unknown;

  /** Static translations to merge immediately (keyed by locale). */
  readonly translations?: Record<string, Record<string, unknown>>;
}
