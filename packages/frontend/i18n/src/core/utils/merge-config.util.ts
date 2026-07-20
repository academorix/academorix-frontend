/**
 * @file merge-config.util.ts
 * @module @stackra/i18n/core/utils
 * @description Merge user options with i18n defaults.
 */

import type { II18nConfig } from "../interfaces";
import { DEFAULT_I18N_CONFIG } from "../constants/defaults.constant";

/**
 * Merge partial i18n options over {@link DEFAULT_I18N_CONFIG}.
 *
 * The single place defaults are applied — `forRoot` and `forRootAsync`
 * both route through this helper.
 *
 * @param options - User-supplied partial configuration.
 * @returns Fully resolved configuration.
 */
export function mergeConfig(options: Partial<II18nConfig> = {}): II18nConfig {
  const merged: II18nConfig = { ...DEFAULT_I18N_CONFIG, ...options };

  // ── Compose the interpolation delimiters (deep-merge one level) ──────────
  if (options.interpolation || DEFAULT_I18N_CONFIG.interpolation) {
    merged.interpolation = {
      ...DEFAULT_I18N_CONFIG.interpolation,
      ...options.interpolation,
    };
  }

  // ── Ensure `supportedLocales` always includes the default ────────────────
  if (!merged.supportedLocales.includes(merged.defaultLocale)) {
    merged.supportedLocales = [merged.defaultLocale, ...merged.supportedLocales];
  }

  return merged;
}
