/**
 * @file collection.ts
 * @module @stackra/support
 * @description Collection utility powered by collect.js under the hood.
 *   Provides a typed `collect()` factory and re-exports the Collection type.
 *   All packages that need collection operations import from here —
 *   never directly from 'collect.js'.
 *
 *   This allows swapping the underlying implementation without
 *   touching consumer code.
 */

import collectJs from "collect.js";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** Re-exported Collection type from collect.js. */
export type Collection<T> = ReturnType<typeof collectJs<T>>;

// ════════════════════════════════════════════════════════════════════════════════
// Factory
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Create a new Collection instance from an array or object.
 *
 * Wraps the value in a collect.js Collection providing 100+ chainable
 * methods for filtering, mapping, grouping, sorting, and aggregating data.
 *
 * @typeParam T - The type of items in the collection
 * @param items - The array or object to wrap
 * @returns A fluent Collection instance
 *
 * @example
 * ```typescript
 * import { collect } from '@stackra/support';
 *
 * const users = collect([
 *   { name: 'Alice', age: 30, role: 'admin' },
 *   { name: 'Bob', age: 25, role: 'user' },
 *   { name: 'Charlie', age: 35, role: 'admin' },
 * ]);
 *
 * // Filter and pluck
 * const adminNames = users
 *   .where('role', 'admin')
 *   .pluck('name')
 *   .all(); // ['Alice', 'Charlie']
 *
 * // Group by
 * const byRole = users.groupBy('role').all();
 * // { admin: [...], user: [...] }
 *
 * // Aggregate
 * const avgAge = users.avg('age'); // 30
 *
 * // Sort and take
 * const youngest = users.sortBy('age').first(); // { name: 'Bob', ... }
 * ```
 *
 * @example
 * ```typescript
 * // Working with numbers
 * const numbers = collect([1, 2, 3, 4, 5]);
 *
 * numbers.sum();           // 15
 * numbers.avg();           // 3
 * numbers.max();           // 5
 * numbers.filter(n => n > 2).all(); // [3, 4, 5]
 * numbers.chunk(2).all();  // [[1, 2], [3, 4], [5]]
 * ```
 */
export function collect<T>(items: T[] | Record<string, T> = []): Collection<T> {
  return collectJs<T>(items as T[]);
}
