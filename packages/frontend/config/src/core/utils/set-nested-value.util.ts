/**
 * @file set-nested-value.util.ts
 * @module @stackra/config/core/utils
 * @description Dotted-path setter for the internal configuration host
 *   record. Replaces `es-toolkit/compat/set` — hand-rolled to keep the
 *   browser bundle free of a large third-party dep.
 *
 *   **Stackra addition** — nestjs uses `es-toolkit/compat/set`; we
 *   hand-roll the equivalent. Handles dotted keys and creates
 *   intermediate objects when needed.
 */

/**
 * Write a value at a dotted property path, creating intermediate
 * objects as required.
 *
 * Supports:
 * - Dotted keys (`'a.b.c'`).
 * - Array indices in bracket form (`'items[0].name'`) — creates arrays
 *   automatically when the parent is missing and the next segment is
 *   a numeric literal.
 * - Symbol top-level keys (via a direct `[key] = value` assignment).
 * - Existing partial paths — writes onto the existing shape without
 *   clobbering unrelated siblings.
 *
 * @param obj - The object to mutate in place.
 * @param path - Dotted or bracketed property path.
 * @param value - The value to write at the resolved path.
 *
 * @example
 * ```typescript
 * const cfg: Record<string, any> = {};
 * setNestedValue(cfg, 'database.host', 'localhost');
 * // cfg === { database: { host: 'localhost' } }
 * ```
 */
export function setNestedValue(obj: unknown, path: string | symbol, value: unknown): void {
  if (obj === null || obj === undefined || typeof obj !== "object") return;
  // Symbol keys bypass path-walking — symbols can only reference a
  // top-level property, so a dotted expansion is a category error.
  if (typeof path === "symbol") {
    (obj as Record<symbol, unknown>)[path] = value;
    return;
  }
  const segments = splitPath(path);
  if (segments.length === 0) return;
  let cursor: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    const next = cursor[segment];
    // Create intermediate objects on missing paths. Choose an array
    // when the NEXT segment is a numeric string — this mirrors the
    // es-toolkit heuristic and lets `'items[0].name'` build a
    // proper `[{ name: ... }]` structure instead of `{ 0: { ... } }`.
    if (next === null || next === undefined || typeof next !== "object") {
      const nextSegment = segments[i + 1]!;
      cursor[segment] = /^\d+$/.test(nextSegment) ? [] : {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]!] = value;
}

/**
 * Split a dotted / bracketed path into individual segments.
 *
 * Package-internal helper; kept in each nested-value util file rather
 * than in a shared helper so each util stays a single self-contained
 * export per `code-standards.md` one-export-per-file rule.
 */
function splitPath(path: string): string[] {
  if (path.length === 0) return [];
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((segment) => segment.length > 0);
}
