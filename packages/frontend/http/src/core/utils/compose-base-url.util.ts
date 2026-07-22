/**
 * @file compose-base-url.util.ts
 * Build a fully-qualified base URL from a connection's `baseURL`,
 * `apiPrefix`, and `version` fields. Strips slashes consistently so
 * the result never contains double slashes or trailing slashes.
 *
 * @module @stackra/http/utils/compose-base-url
 */

import { Str } from "@stackra/support";

/**
 * Trim leading and trailing slashes from a path segment.
 */
function trimSlashes(segment: string): string {
  return segment.replace(/^\/+|\/+$/g, "");
}

/**
 * Compose a base URL from root + optional prefix + optional version.
 *
 * @param baseURL   - Root URL (e.g. `"https://api.example.com"`).
 * @param apiPrefix - Optional path prefix (e.g. `"api"`).
 * @param version   - Optional version segment (e.g. `"v1"`).
 * @returns Composed URL or `undefined` when `baseURL` is empty.
 *
 * @example
 * ```typescript
 * composeBaseURL('https://api.example.com', 'api', 'v1');
 * // → "https://api.example.com/api/v1"
 *
 * composeBaseURL('https://api.example.com/', '/api/', 'v2');
 * // → "https://api.example.com/api/v2"
 *
 * composeBaseURL();
 * // → undefined
 * ```
 */
export function composeBaseURL(
  baseURL?: string,
  apiPrefix?: string,
  version?: string,
): string | undefined {
  if (!baseURL || Str.trim(baseURL).length === 0) {
    return undefined;
  }

  const root = baseURL.replace(/\/+$/, "");
  const parts: string[] = [root];

  if (apiPrefix && Str.trim(apiPrefix).length > 0) {
    parts.push(trimSlashes(apiPrefix));
  }

  if (version && Str.trim(version).length > 0) {
    parts.push(trimSlashes(version));
  }

  return parts.join("/");
}
