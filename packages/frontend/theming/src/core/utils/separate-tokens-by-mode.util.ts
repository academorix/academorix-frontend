/**
 * @file separate-tokens-by-mode.util.ts
 * @module @stackra/theming/utils
 * @description Splits a flat token object into light and dark groups.
 */

// ============================================================================
// Utility
// ============================================================================

/**
 * Separate tokens into light and dark groups.
 *
 * Tokens prefixed with `dark_` are placed into the dark group with the prefix
 * stripped. All other tokens go into the light group. Tokens with `null` or
 * `undefined` values are skipped.
 *
 * @param tokens - A flat token object from the backend API response.
 * @returns An object with `light` and `dark` groups.
 *
 * @example
 * ```typescript
 * separateTokensByMode({
 *   accent: 'oklch(0.62 0.19 253)',
 *   dark_background: 'oklch(0.12 0.005 285)',
 *   background: 'oklch(0.97 0 0)',
 * });
 * // → { light: { accent: '...', background: '...' }, dark: { background: '...' } }
 * ```
 */
export function separateTokensByMode(tokens: Record<string, unknown>): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  for (const [key, value] of Object.entries(tokens)) {
    if (value == null) {
      continue;
    }

    const stringValue = String(value);

    if (key.startsWith("dark_")) {
      const strippedKey = key.slice(5);
      dark[strippedKey] = stringValue;
    } else {
      light[key] = stringValue;
    }
  }

  return { light, dark };
}
