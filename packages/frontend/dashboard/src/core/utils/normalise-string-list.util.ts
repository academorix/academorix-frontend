/**
 * @file normalise-string-list.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Normalise a user-supplied list of strings into a
 *   compact, deduplicated `readonly string[]`. Empty entries are
 *   dropped so a share dialog can paste multi-line textareas verbatim.
 *
 *   Returns `undefined` when the resulting list is empty — the
 *   embed-token record uses `undefined` as the "no restriction"
 *   sentinel, so the resolver never has to distinguish
 *   `[] === undefined`.
 */

import { Str } from "@stackra/support";

/**
 * Trim + dedupe + drop-empty pass on a user-supplied string list.
 *
 * @param input - Raw list (may include whitespace, duplicates, empties).
 * @returns Normalised list, or `undefined` when nothing survives.
 */
export function normaliseStringList(
  input: readonly string[] | undefined,
): readonly string[] | undefined {
  if (!input || input.length === 0) return undefined;

  const cleaned: string[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const trimmed = Str.trim(raw);

    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    cleaned.push(trimmed);
  }

  return cleaned.length > 0 ? cleaned : undefined;
}
