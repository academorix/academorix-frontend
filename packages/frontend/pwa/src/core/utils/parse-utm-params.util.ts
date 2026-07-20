/**
 * @file parse-utm-params.util.ts
 * @module @stackra/pwa/core/utils
 * @description Parse UTM parameters out of a URL search string.
 */

import type { IPwaUtmParams } from "../interfaces";

/** UTM keys and the field they map to on {@link IPwaUtmParams}. */
const UTM_KEYS: ReadonlyArray<readonly [string, keyof IPwaUtmParams]> = [
  ["utm_source", "source"],
  ["utm_medium", "medium"],
  ["utm_campaign", "campaign"],
  ["utm_term", "term"],
  ["utm_content", "content"],
];

/**
 * Parse UTM parameters out of a search string.
 *
 * Empty and missing parameters are omitted from the result rather
 * than set to empty strings — so `Object.keys(utm).length === 0`
 * reads as "no attribution present".
 *
 * @param search - The `location.search` string (may or may not
 *   start with `?`). Defaults to `window.location.search` when
 *   omitted and `window` is available; falls back to `''` on SSR.
 * @returns A partial {@link IPwaUtmParams} with only the fields
 *   that were actually present.
 */
export function parseUtmParams(search?: string): IPwaUtmParams {
  const raw =
    search ?? (typeof window !== "undefined" && window.location ? window.location.search : "");
  if (!raw) return {};

  // URLSearchParams tolerates a missing '?' but not `null`.
  const normalised = raw.startsWith("?") ? raw : `?${raw}`;
  const params = new URLSearchParams(normalised);

  const result: Record<string, string> = {};
  for (const [key, field] of UTM_KEYS) {
    const value = params.get(key);
    if (value && value.length > 0) result[field] = value;
  }
  return result as IPwaUtmParams;
}
