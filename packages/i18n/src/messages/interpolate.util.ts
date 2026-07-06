/**
 * @file interpolate.util.ts
 * @module @academorix/i18n/messages/interpolate.util
 *
 * @description
 * Tiny `{{placeholder}}` interpolator shared by the dashboard's Refine
 * translator and any other consumer that needs param substitution
 * without importing `intl-messageformat`.
 *
 * Supports:
 *   - Simple substitution: `"Hi {{name}}"` + `{ name: "Sam" }` → `"Hi Sam"`.
 *   - Whitespace tolerance: `"Hi {{ name }}"` works too.
 *   - Missing params: unmatched placeholders are left intact so the
 *     failure is visible in the UI rather than silently blank.
 *
 * Does NOT support: ICU plurals, gender selectors, nested params, or
 * HTML — consumers that need those should reach for `intl-messageformat`
 * directly.
 */

/**
 * Replaces `{{name}}` (and `{{ name }}`) placeholders in `message`
 * with values from `params`. Placeholders whose key isn't in `params`
 * are left intact.
 *
 * @param message - The message string.
 * @param params - Values to substitute, keyed by placeholder name.
 * @returns The interpolated string.
 *
 * @example
 * ```ts
 * interpolate("Hi {{name}}", { name: "Sam" });      // → "Hi Sam"
 * interpolate("Hi {{ name }}", { name: "Sam" });    // → "Hi Sam"
 * interpolate("Hi {{name}}", {});                   // → "Hi {{name}}"
 * interpolate("Hi {{name}}", { other: "x" });       // → "Hi {{name}}"
 * ```
 */
export function interpolate(message: string, params?: Record<string, unknown>): string {
  if (!params) {
    return message;
  }

  return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = params[key];

    return value === undefined || value === null ? match : String(value);
  });
}
