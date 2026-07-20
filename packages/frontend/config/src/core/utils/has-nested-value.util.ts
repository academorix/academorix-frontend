/**
 * @file has-nested-value.util.ts
 * @module @stackra/config/core/utils
 * @description Dotted-path presence check for the internal
 *   configuration host record. Replaces `es-toolkit/compat/has` —
 *   hand-rolled to keep the browser bundle free of a large
 *   third-party dep.
 *
 *   **Stackra addition** — nestjs uses `es-toolkit/compat/has`; we
 *   hand-roll the equivalent.
 */

/**
 * Determine whether a dotted property path exists on an object.
 *
 * Differs from `getNestedValue(obj, path) !== undefined` in that a
 * key explicitly set to `undefined` still returns `true` — matches
 * es-toolkit's semantics.
 *
 * @param obj - The object to inspect.
 * @param path - Dotted or bracketed property path.
 * @returns `true` when every segment resolves; `false` on any miss.
 *
 * @example
 * ```typescript
 * hasNestedValue({ a: { b: undefined } }, 'a.b'); // true — 'b' exists
 * hasNestedValue({ a: {} }, 'a.b');               // false — 'b' missing
 * ```
 */
export function hasNestedValue(obj: unknown, path: string | symbol): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof path === "symbol") {
    return typeof obj === "object" && path in (obj as object);
  }
  const segments = splitPath(path);
  if (segments.length === 0) return false;
  let cursor: unknown = obj;
  for (const segment of segments) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return false;
    }
    // Use `in` (rather than `!== undefined`) so a key explicitly set
    // to `undefined` still registers as present — matches es-toolkit.
    if (!(segment in (cursor as object))) return false;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return true;
}

/**
 * Split a dotted / bracketed path into individual segments.
 *
 * Package-internal helper; the trio of nested-value utils each keep
 * their own copy to stay self-contained.
 */
function splitPath(path: string): string[] {
  if (path.length === 0) return [];
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((segment) => segment.length > 0);
}
