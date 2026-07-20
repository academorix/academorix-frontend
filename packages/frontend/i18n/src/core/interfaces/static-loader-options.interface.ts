/**
 * @file static-loader-options.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description StaticLoaderOptions interface.
 */

import type { I18nTranslation } from "@stackra/contracts";

/**
 * Options for the StaticLoader.
 */
export interface StaticLoaderOptions {
  /** Pre-loaded translations keyed by locale. */
  readonly translations: Record<string, I18nTranslation>;
}
