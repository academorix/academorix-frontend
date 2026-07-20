/**
 * @file deep-equal.util.ts
 * @module @stackra/ai/core/utils
 * @description Structural equality for JSON-serializable values. Used to
 *   diff-suppress context syncs and guard context-frame snapshot updates.
 */

/**
 * Structural (deep) equality for JSON-serializable values.
 *
 * Compares primitives by `Object.is` (so `NaN` equals `NaN` and `+0`/`-0`
 * differ), arrays element-wise, and plain objects by their own enumerable
 * keys. Not intended for class instances, functions, `Map`/`Set`, or cyclic
 * structures — the AI context/snapshot values it compares are plain JSON.
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns `true` when the two values are structurally equal.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) {
    return false;
  }

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) {
      return false;
    }
    if (!deepEqual(aObj[key], bObj[key])) {
      return false;
    }
  }

  return true;
}
