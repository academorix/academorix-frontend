/**
 * @file url.util.ts
 * @module @academorix/core/utils/url.util
 *
 * @description
 * Tiny URL primitives shared across the workspace. Kept here (in
 * `@academorix/core`) so `@academorix/http`, `@academorix/pwa`, and
 * every app's env resolver can use the same helpers without a
 * dependency cycle.
 */

/**
 * Removes one or more trailing slashes so callers can concatenate
 * a path unconditionally: `${trimTrailingSlash(base)}/login` always
 * yields exactly one `/`.
 */
export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Ensures a path begins with a single leading slash.
 *
 * `"login"` → `"/login"`
 * `"/login"` → `"/login"`
 * `"//login"` → `"/login"`
 */
export function ensureLeadingSlash(path: string): string {
  return `/${path.replace(/^\/+/, "")}`;
}

/**
 * Joins a base URL with a path, deduplicating slashes at the boundary.
 * Preserves the query string of the base URL if any.
 *
 * @example
 * ```ts
 * joinUrl("https://api.example.com/", "/v1/users"); // → "https://api.example.com/v1/users"
 * joinUrl("https://api.example.com/v1", "users");   // → "https://api.example.com/v1/users"
 * ```
 */
export function joinUrl(base: string, path: string): string {
  return `${trimTrailingSlash(base)}${ensureLeadingSlash(path)}`;
}
