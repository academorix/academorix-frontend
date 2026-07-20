/**
 * @file deep-merge.util.ts
 * @module @stackra/vite/core/utils
 * @description Recursive object merge — plain objects merged
 *   recursively, arrays concatenated, primitives overwritten by
 *   the override. Class instances (non-plain objects) are
 *   overwritten as-is. `undefined` in the override is skipped so
 *   base values survive.
 */

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if a value is a plain object literal (not an array, `null`,
 * a class instance, a `Date`, a `Map`, ...). Only plain objects
 * are eligible for recursive merging — class instances, `Date`,
 * `RegExp`, etc. get overwritten wholesale to avoid stitching
 * together halves of two different runtime shapes.
 *
 * @param value - Any value.
 * @returns `true` if the value is a plain object (constructed via
 *   `{}` or `Object.create(null)`).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  // Two acceptable prototypes: `Object.prototype` (plain object
  // literal) and `null` (from `Object.create(null)`). Anything else
  // is a class instance.
  return proto === Object.prototype || proto === null;
}

// ════════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════════

/**
 * Deep-merge two objects. Override values win on conflict.
 *
 * Merge rules:
 * - **Plain objects** are merged recursively; keys from both sides
 *   survive, and colliding keys favour the override.
 * - **Arrays** are concatenated (`[...base, ...override]`) — this
 *   is intentional because Vite plugin arrays and CSS include
 *   arrays typically want to accumulate.
 * - **Primitives** and **class instances** are overwritten
 *   wholesale by the override.
 * - **`undefined` in the override** is skipped so the base value
 *   survives (a caller passing `undefined` means "no opinion", not
 *   "clear this field").
 *
 * @typeParam T - The shape of both `base` and the merged result.
 * @param base - Base configuration.
 * @param overrides - Override configuration; wins on conflict.
 * @returns A new merged object. The inputs are never mutated.
 *
 * @example
 * ```typescript
 * const merged = deepMerge(
 *   { build: { target: 'es2020', minify: true } },
 *   { build: { target: 'es2022' } },
 * );
 * // → { build: { target: 'es2022', minify: true } }
 * ```
 */
export function deepMerge<T>(base: T, overrides: Partial<T>): T {
  // Copy the base so we never mutate the caller's object.
  const result = { ...(base as Record<string, unknown>) } as Record<string, unknown>;
  const overrideBag = overrides as Record<string, unknown>;

  for (const key of Object.keys(overrideBag)) {
    const overrideValue = overrideBag[key];

    // `undefined` in the override means "no opinion" — keep the
    // base value untouched. Passing `null` to clear a field is
    // still supported (falls through to the primitive branch).
    if (overrideValue === undefined) continue;

    const baseValue = result[key];

    if (Array.isArray(baseValue) && Array.isArray(overrideValue)) {
      // Array concatenation preserves plugin ordering and other
      // list-like accumulations. Use spread to keep both inputs
      // immutable.
      result[key] = [...baseValue, ...overrideValue];
      continue;
    }

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      // Recurse into nested plain objects. Both sides being plain
      // is required — a class instance on either side means
      // "overwrite", never "stitch".
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }

    // Primitives, class instances, mismatched types — override
    // wins wholesale.
    result[key] = overrideValue;
  }

  return result as T;
}
