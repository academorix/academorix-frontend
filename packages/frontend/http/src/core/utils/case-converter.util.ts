/**
 * Case conversion utility.
 *
 * Recursive camelCase ↔ snake_case conversion that preserves Date
 * objects and primitives, used by `TransformInterceptor` to bridge
 * TypeScript-style camelCase to API-style snake_case.
 *
 * @module @stackra/http/utils/case-converter
 */

import { Str } from '@stackra/support';

/**
 * Recursive case conversion helpers.
 */
export class CaseConverter {
  /**
   * Convert object keys from camelCase to snake_case.
   *
   * Handles:
   *
   * - `null` / `undefined` — passthrough.
   * - Primitives — passthrough.
   * - `Date` — passthrough (preserved unchanged).
   * - Arrays — element-by-element recursion.
   * - Plain objects — key-by-key recursion.
   *
   * Does not handle circular references — callers are expected to
   * pass acyclic structures.
   *
   * @param input - Value to convert.
   * @returns Converted value.
   */
  public static toSnakeCase(input: unknown): unknown {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return input;
    if (input instanceof Date) return input;

    if (Array.isArray(input)) {
      return input.map((item) => CaseConverter.toSnakeCase(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${Str.lower(letter)}`);
      result[snakeKey] = CaseConverter.toSnakeCase(value);
    }
    return result;
  }

  /**
   * Convert object keys from snake_case to camelCase.
   *
   * Same handling rules as {@link toSnakeCase}.
   *
   * @param input - Value to convert.
   * @returns Converted value.
   */
  public static toCamelCase(input: unknown): unknown {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return input;
    if (input instanceof Date) return input;

    if (Array.isArray(input)) {
      return input.map((item) => CaseConverter.toCamelCase(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const camelKey = key.replace(/_([a-z])/g, (_match, letter: string) => Str.upper(letter));
      result[camelKey] = CaseConverter.toCamelCase(value);
    }
    return result;
  }
}
