/**
 * @file map-tokens-to-vars.util.ts
 * @module @stackra/theming/utils
 * @description Converts a token object to CSS variable entries.
 */

import { tokenToCssVar } from "./token-to-css-var.util";

// ============================================================================
// Utility
// ============================================================================

/**
 * Map a flat token object to CSS variable entries.
 *
 * Returns an array of `{ variable, value }` pairs where each token key is
 * converted to a CSS custom property name via `tokenToCssVar` and each
 * value is converted to a string. Tokens with `null` or `undefined` values
 * are skipped.
 *
 * @param tokens - A flat token object.
 * @returns An array of CSS variable entries ready for application.
 *
 * @example
 * ```typescript
 * mapTokensToVars({ accent: 'oklch(0.62 0.19 253)' });
 * // → [{ variable: '--accent', value: 'oklch(0.62 0.19 253)' }]
 * ```
 */
export function mapTokensToVars(
  tokens: Record<string, unknown>,
): Array<{ variable: string; value: string }> {
  const entries: Array<{ variable: string; value: string }> = [];

  for (const [key, value] of Object.entries(tokens)) {
    if (value == null) {
      continue;
    }

    entries.push({
      variable: tokenToCssVar(key),
      value: String(value),
    });
  }

  return entries;
}
