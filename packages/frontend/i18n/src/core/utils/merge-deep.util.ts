/**
 * @file merge-deep.util.ts
 * @module @stackra/i18n/core/utils
 * @description Deep merge utility for translation objects.
 */

/**
 * Deep merge two objects. Properties from `source` override `target`.
 * Nested objects are merged recursively. Arrays are replaced (not merged).
 *
 * @param target - The base object
 * @param source - The object to merge into target
 * @returns A new merged object (does not mutate inputs)
 */
export function mergeDeep(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = mergeDeep(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Check if a value is a plain object (not array, not null).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
