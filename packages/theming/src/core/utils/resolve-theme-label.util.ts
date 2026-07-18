/**
 * @file resolve-theme-label.util.ts
 * @module @stackra/theming/utils
 * @description Resolves a theme's display label with i18n fallback chain.
 */

import type { ITheme } from '@stackra/contracts';

// ============================================================================
// Utility
// ============================================================================

/**
 * Resolve the user-facing label for a theme.
 *
 * Prefer `labelKey` (lazy i18n lookup) → `label` (pre-resolved string)
 * → title-cased `id` (last-resort fallback).
 *
 * Components should call this on each render so label changes when the
 * active locale changes.
 *
 * @param theme - The registered theme.
 * @param translate - Optional i18n translate function (e.g., `t` from useI18n).
 * @returns Localised label string.
 */
export function resolveThemeLabel(
  theme: ITheme,
  translate?: (key: string) => string
): string {
  if (theme.labelKey && translate) {
    const translated = translate(theme.labelKey);
    if (translated && translated !== theme.labelKey) {
      return translated;
    }
  }

  if (theme.label) {
    return theme.label;
  }

  // Title-case fallback from ID
  return theme.id.charAt(0).toUpperCase() + theme.id.slice(1);
}
