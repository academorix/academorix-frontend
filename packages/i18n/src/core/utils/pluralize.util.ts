/**
 * @file pluralize.util.ts
 * @module @stackra/i18n/core/utils
 * @description CLDR-based pluralization using Intl.PluralRules.
 *   Selects the correct plural form from a translation object based on count.
 */

import type { I18nPluralObject } from '../interfaces';
import { PLURAL_KEYS } from '../constants';

// ============================================================================
// Cache
// ============================================================================

/** Cached PluralRules instances per locale. */
const pluralRulesCache = new Map<string, Intl.PluralRules>();

/**
 * Get or create a cached Intl.PluralRules instance for a locale.
 *
 * @param locale - The locale code
 * @returns PluralRules instance
 */
function getPluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a translation value is a plural object (contains CLDR plural keys).
 *
 * @param translation - The translation value to check
 * @returns The plural object if it contains plural keys, undefined otherwise
 */
export function getPluralObject(translation: unknown): I18nPluralObject | undefined {
  if (typeof translation !== 'object' || translation === null || Array.isArray(translation)) {
    return undefined;
  }

  const obj = translation as Record<string, unknown>;
  for (const key of PLURAL_KEYS) {
    if (key in obj) {
      return obj as unknown as I18nPluralObject;
    }
  }

  return undefined;
}

/**
 * Select the correct plural form from a plural object based on count and locale.
 *
 * Uses `Intl.PluralRules` for CLDR-compliant category selection.
 * Special case: if count is 0 and a `zero` form exists, it's preferred.
 *
 * @param pluralObject - Object with plural forms (one, other, zero, few, many, two)
 * @param count - The numeric count to pluralize for
 * @param locale - The locale code for plural rule selection
 * @returns The selected plural form string, or undefined if no match
 */
export function selectPlural(
  pluralObject: I18nPluralObject,
  count: number,
  locale: string
): string | undefined {
  // Explicit zero form
  if (count === 0 && pluralObject.zero) {
    return pluralObject.zero;
  }

  // CLDR category selection
  const rules = getPluralRules(locale);
  const category = rules.select(count);

  return pluralObject[category as keyof I18nPluralObject];
}
