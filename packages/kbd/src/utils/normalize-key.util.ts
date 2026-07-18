/**
 * @fileoverview normalizeKey — coerce KeyboardEvent.key into a stable token.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import { Str } from "@stackra/support";

/**
 * Map of awkward `KeyboardEvent.key` values to friendly tokens.
 *
 * The registry stores every shortcut key in lowercase canonical form,
 * so we normalize before comparison.
 */
const KEY_ALIASES: Record<string, string> = {
  " ": "space",
  spacebar: "space",
  esc: "escape",
  return: "enter",
  del: "delete",
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
};

/**
 * Convert a raw `KeyboardEvent.key` into a stable lowercase token.
 *
 * @param key - The raw key string from the event.
 * @returns Lowercase canonical token (`"k"`, `"escape"`, `"space"`).
 */
export function normalizeKey(key: string): string {
  const lower = Str.lower(key);
  return KEY_ALIASES[lower] ?? lower;
}
