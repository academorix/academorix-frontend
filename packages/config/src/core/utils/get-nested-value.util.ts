/**
 * @file get-nested-value.util.ts
 * @module @stackra/config/core/utils
 * @description Dotted-path getter for the internal configuration host
 *   record. Replaces `es-toolkit/compat/get` — hand-rolled here to
 *   keep the browser bundle free of a large third-party dep.
 *
 *   **Stackra addition** — nestjs uses `es-toolkit/compat/get`; we
 *   hand-roll the equivalent in ~30 LOC. Handles dotted keys and
 *   `foo[0].bar` array-index syntax.
 */

/**
 * Read a value at a dotted property path from an arbitrary object.
 *
 * Supports:
 * - Dotted keys (`'a.b.c'`).
 * - Array indices in bracket form (`'items[0].name'`).
 * - Array indices in dotted form (`'items.0.name'`).
 * - Missing intermediate keys — returns `undefined` instead of throwing.
 * - Symbol / string top-level keys (via the plain `[key]` lookup).
 *
 * @param obj - The object to read from. `null` / `undefined` return
 *   `undefined` (fail-soft parity with `es-toolkit`'s behaviour).
 * @param path - Dotted or bracketed property path. `symbol` keys are
 *   supported but only at the top level (dotted-path semantics don't
 *   apply to symbol keys — they are accessed directly).
 * @returns The resolved value, or `undefined` when any segment misses.
 *
 * @example
 * ```typescript
 * getNestedValue({ a: { b: { c: 42 } } }, 'a.b.c'); // 42
 * getNestedValue({ items: [{ id: 1 }] }, 'items[0].id'); // 1
 * getNestedValue({}, 'a.b.c'); // undefined
 * ```
 */
export function getNestedValue(obj: unknown, path: string | symbol): unknown {
  if (obj === null || obj === undefined) return undefined;
  // Symbol keys short-circuit the dotted-path walk — symbols cannot
  // appear inside a "a.b.c" string, so the caller wanted a direct
  // top-level lookup.
  if (typeof path === "symbol") {
    return (obj as Record<symbol, unknown>)[path];
  }
  const segments = splitPath(path);
  let cursor: unknown = obj;
  for (const segment of segments) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

/**
 * Split a dotted / bracketed path into its individual segments.
 *
 * `'items[0].name'` → `['items', '0', 'name']`.
 *
 * Package-internal helper — not exported. Handles the same shape as
 * es-toolkit's path parser (dotted OR bracketed) so migration is a
 * drop-in.
 */
function splitPath(path: string): string[] {
  if (path.length === 0) return [];
  // Normalise bracketed indices into dotted form first, then split on
  // dots. The regex is deliberately narrow (only digits inside the
  // brackets) — property names with dots in them cannot round-trip
  // through this scheme anyway.
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((segment) => segment.length > 0);
}
