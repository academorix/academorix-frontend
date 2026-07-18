/**
 * @file arr.ts
 * @module @stackra/support
 * @description Static array and object manipulation class.
 *   Provides a comprehensive set of array helpers for filtering, grouping,
 *   chunking, sorting, and transforming collections.
 *   All methods are static — no instantiation required.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** Key accessor — either a string key or a function that extracts a value. */
export type KeyAccessor<T, R = unknown> = keyof T | ((item: T) => R);

// ════════════════════════════════════════════════════════════════════════════════
// Arr Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Static array and object utility class.
 *
 * Provides a consistent API for common array operations: filtering,
 * grouping, chunking, plucking, and more. Methods are pure functions
 * that never mutate the input.
 *
 * @example
 * ```typescript
 * import { Arr } from '@stackra/support';
 *
 * Arr.chunk([1, 2, 3, 4, 5], 2);          // [[1, 2], [3, 4], [5]]
 * Arr.pluck(users, 'name');                // ['Alice', 'Bob']
 * Arr.groupBy(items, 'category');          // { food: [...], drink: [...] }
 * ```
 */
export class Arr {
  // ══════════════════════════════════════════════════════════════════════════
  // Wrapping & Flattening
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Wrap a value in an array if it is not already one.
   *
   * If the value is null or undefined, returns an empty array.
   * If the value is already an array, returns it unchanged.
   *
   * @param value - The value to wrap
   * @returns An array containing the value, or the value itself if already an array
   *
   * @example
   * ```typescript
   * Arr.wrap('hello');     // ['hello']
   * Arr.wrap([1, 2, 3]);  // [1, 2, 3]
   * Arr.wrap(null);        // []
   * Arr.wrap(undefined);   // []
   * ```
   */
  public static wrap<T>(value: T | T[] | null | undefined): T[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  /**
   * Flatten a nested array to a given depth.
   *
   * @param arr - The array to flatten
   * @param depth - Maximum depth to flatten (default: 1)
   * @returns The flattened array
   *
   * @example
   * ```typescript
   * Arr.flatten([[1, 2], [3, [4, 5]]]);     // [1, 2, 3, [4, 5]]
   * Arr.flatten([[1, 2], [3, [4, 5]]], 2);  // [1, 2, 3, 4, 5]
   * ```
   */
  public static flatten<T>(arr: unknown[], depth: number = 1): T[] {
    return arr.flat(depth) as T[];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Retrieval
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the first element of an array, optionally matching a predicate.
   *
   * @param arr - The input array
   * @param predicate - Optional filter function
   * @returns The first matching element, or undefined
   *
   * @example
   * ```typescript
   * Arr.first([1, 2, 3]);                  // 1
   * Arr.first([1, 2, 3], n => n > 1);     // 2
   * Arr.first([]);                          // undefined
   * ```
   */
  public static first<T>(arr: T[], predicate?: (item: T) => boolean): T | undefined {
    if (!predicate) return arr[0];
    return arr.find(predicate);
  }

  /**
   * Get the last element of an array, optionally matching a predicate.
   *
   * @param arr - The input array
   * @param predicate - Optional filter function
   * @returns The last matching element, or undefined
   *
   * @example
   * ```typescript
   * Arr.last([1, 2, 3]);                  // 3
   * Arr.last([1, 2, 3], n => n < 3);     // 2
   * ```
   */
  public static last<T>(arr: T[], predicate?: (item: T) => boolean): T | undefined {
    if (!predicate) return arr[arr.length - 1];
    const filtered = arr.filter(predicate);
    return filtered[filtered.length - 1];
  }

  /**
   * Get a random element from an array.
   *
   * @param arr - The input array
   * @returns A random element, or undefined if the array is empty
   *
   * @example
   * ```typescript
   * Arr.random([1, 2, 3, 4, 5]); // e.g., 3
   * ```
   */
  public static random<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Transformation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Pluck a single property value from each object in an array.
   *
   * @param arr - Array of objects
   * @param key - The property key to pluck
   * @returns Array of plucked values
   *
   * @example
   * ```typescript
   * const users = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
   * Arr.pluck(users, 'name'); // ['Alice', 'Bob']
   * ```
   */
  public static pluck<T extends Record<string, unknown>, K extends keyof T>(
    arr: T[],
    key: K,
  ): T[K][] {
    return arr.map((item) => item[key]);
  }

  /**
   * Group array elements by a key or key function.
   *
   * @param arr - Array of objects
   * @param key - The property key or function to group by
   * @returns An object mapping group keys to arrays of items
   *
   * @example
   * ```typescript
   * const items = [
   *   { type: 'fruit', name: 'apple' },
   *   { type: 'veggie', name: 'carrot' },
   *   { type: 'fruit', name: 'banana' },
   * ];
   * Arr.groupBy(items, 'type');
   * // { fruit: [{...}, {...}], veggie: [{...}] }
   * ```
   */
  public static groupBy<T>(arr: T[], key: KeyAccessor<T, string | number>): Record<string, T[]> {
    const result: Record<string, T[]> = {};

    for (const item of arr) {
      const groupKey = String(
        typeof key === "function" ? key(item) : (item as Record<string, unknown>)[key as string],
      );

      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey]!.push(item);
    }

    return result;
  }

  /**
   * Key an array of objects by a given property, returning a map of key → item.
   *
   * If multiple items share a key, the last one wins.
   *
   * @param arr - Array of objects
   * @param key - The property key or function to key by
   * @returns An object mapping keys to single items
   *
   * @example
   * ```typescript
   * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
   * Arr.keyBy(users, 'id'); // { 1: {...}, 2: {...} }
   * ```
   */
  public static keyBy<T>(arr: T[], key: KeyAccessor<T, string | number>): Record<string, T> {
    const result: Record<string, T> = {};

    for (const item of arr) {
      const mapKey = String(
        typeof key === "function" ? key(item) : (item as Record<string, unknown>)[key as string],
      );
      result[mapKey] = item;
    }

    return result;
  }

  /**
   * Get a subset of an object containing only the specified keys.
   *
   * @param obj - The source object
   * @param keys - Array of keys to include
   * @returns A new object with only the specified keys
   *
   * @example
   * ```typescript
   * Arr.only({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
   * ```
   */
  public static only<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[],
  ): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Get a subset of an object excluding the specified keys.
   *
   * @param obj - The source object
   * @param keys - Array of keys to exclude
   * @returns A new object without the specified keys
   *
   * @example
   * ```typescript
   * Arr.except({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
   * ```
   */
  public static except<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[],
  ): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Chunking & Splitting
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Split an array into chunks of a given size.
   *
   * @param arr - The input array
   * @param size - The maximum chunk size
   * @returns Array of arrays, each with at most `size` elements
   *
   * @example
   * ```typescript
   * Arr.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
   * Arr.chunk([1, 2, 3], 5);       // [[1, 2, 3]]
   * ```
   */
  public static chunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [];
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Filtering & Deduplication
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get unique values from an array, optionally by a key.
   *
   * @param arr - The input array
   * @param key - Optional property key or function for uniqueness comparison
   * @returns Array with duplicate values removed
   *
   * @example
   * ```typescript
   * Arr.unique([1, 2, 2, 3, 3]);                      // [1, 2, 3]
   * Arr.unique([{ id: 1 }, { id: 1 }, { id: 2 }], 'id'); // [{ id: 1 }, { id: 2 }]
   * ```
   */
  public static unique<T>(arr: T[], key?: KeyAccessor<T>): T[] {
    if (!key) {
      return [...new Set(arr)];
    }

    const seen = new Set<unknown>();
    const result: T[] = [];

    for (const item of arr) {
      const value =
        typeof key === "function" ? key(item) : (item as Record<string, unknown>)[key as string];

      if (!seen.has(value)) {
        seen.add(value);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Remove falsy values (null, undefined, 0, '', false, NaN) from an array.
   *
   * @param arr - The input array
   * @returns Array with falsy values removed
   *
   * @example
   * ```typescript
   * Arr.compact([0, 1, null, 2, undefined, 3, '', false]); // [1, 2, 3]
   * ```
   */
  public static compact<T>(arr: (T | null | undefined | false | 0 | "")[]): T[] {
    return arr.filter(Boolean) as T[];
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Sorting & Shuffling
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Sort an array of objects by a key.
   *
   * Returns a new sorted array; does not mutate the original.
   *
   * @param arr - Array of objects
   * @param key - The property key or function to sort by
   * @returns A new sorted array
   *
   * @example
   * ```typescript
   * const users = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
   * Arr.sortBy(users, 'name'); // [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
   * ```
   */
  public static sortBy<T>(arr: T[], key: KeyAccessor<T>): T[] {
    return [...arr].sort((a, b) => {
      const valA =
        typeof key === "function" ? key(a) : (a as Record<string, unknown>)[key as string];
      const valB =
        typeof key === "function" ? key(b) : (b as Record<string, unknown>)[key as string];

      if ((valA as string | number) < (valB as string | number)) return -1;
      if ((valA as string | number) > (valB as string | number)) return 1;
      return 0;
    });
  }

  /**
   * Shuffle an array using the Fisher-Yates algorithm.
   *
   * Returns a new shuffled array; does not mutate the original.
   *
   * @param arr - The input array
   * @returns A new array with elements in random order
   *
   * @example
   * ```typescript
   * Arr.shuffle([1, 2, 3, 4, 5]); // e.g., [3, 1, 5, 2, 4]
   * ```
   */
  public static shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Aggregation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Sum the values of an array, optionally by a key.
   *
   * @param arr - The input array
   * @param key - Optional property key or function to extract numeric values
   * @returns The sum of all values
   *
   * @example
   * ```typescript
   * Arr.sum([1, 2, 3, 4]);                          // 10
   * Arr.sum([{ price: 10 }, { price: 20 }], 'price'); // 30
   * ```
   */
  public static sum<T>(arr: T[], key?: KeyAccessor<T, number>): number {
    if (!key) {
      return (arr as unknown as number[]).reduce((acc, val) => acc + val, 0);
    }

    return arr.reduce((acc, item) => {
      const value =
        typeof key === "function" ? key(item) : (item as Record<string, unknown>)[key as string];
      return acc + (Number(value) || 0);
    }, 0);
  }

  /**
   * Count the number of elements in an array.
   *
   * @param arr - The input array
   * @returns The array length
   *
   * @example
   * ```typescript
   * Arr.count([1, 2, 3]); // 3
   * Arr.count([]);         // 0
   * ```
   */
  public static count<T>(arr: T[]): number {
    return arr.length;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Inspection
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if an array is empty.
   *
   * @param arr - The input array
   * @returns True if the array has zero elements
   *
   * @example
   * ```typescript
   * Arr.isEmpty([]);      // true
   * Arr.isEmpty([1]);     // false
   * ```
   */
  public static isEmpty<T>(arr: T[]): boolean {
    return arr.length === 0;
  }

  /**
   * Check if an array is not empty.
   *
   * @param arr - The input array
   * @returns True if the array has at least one element
   *
   * @example
   * ```typescript
   * Arr.isNotEmpty([1, 2]); // true
   * Arr.isNotEmpty([]);     // false
   * ```
   */
  public static isNotEmpty<T>(arr: T[]): boolean {
    return arr.length > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Generation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a numeric range array.
   *
   * @param start - The starting number (inclusive)
   * @param end - The ending number (inclusive)
   * @param step - The step increment (default: 1)
   * @returns An array of numbers from start to end
   *
   * @example
   * ```typescript
   * Arr.range(1, 5);       // [1, 2, 3, 4, 5]
   * Arr.range(0, 10, 2);   // [0, 2, 4, 6, 8, 10]
   * Arr.range(5, 1, -1);   // [5, 4, 3, 2, 1]
   * ```
   */
  public static range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];

    if (step === 0) return result;

    if (step > 0) {
      for (let i = start; i <= end; i += step) {
        result.push(i);
      }
    } else {
      for (let i = start; i >= end; i += step) {
        result.push(i);
      }
    }

    return result;
  }
}
