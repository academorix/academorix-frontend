/**
 * @file prefix-key.util.ts
 * @module @stackra/storage/core/utils
 * @description Key-prefix helpers for stores that share a physical
 *   backing store (`localStorage`, `sessionStorage`, `AsyncStorage`)
 *   with other consumers. The prefix carves out a namespace so
 *   multiple `IStorage` instances coexist without collision.
 */

import { Str } from "@stackra/support";

/**
 * Prepend the store's prefix to a raw key.
 *
 * @param prefix - The store's configured prefix. When empty, the
 *   returned key is unchanged.
 * @param key - The caller-supplied key.
 * @returns The fully-qualified storage-layer key.
 *
 * @example
 * ```typescript
 * prefixKey('app:prefs', 'theme'); // → 'app:prefs:theme'
 * prefixKey('', 'theme');          // → 'theme'
 * ```
 */
export function prefixKey(prefix: string, key: string): string {
  if (!prefix) return key;
  return `${prefix}:${key}`;
}

/**
 * Strip the store's prefix from a fully-qualified key.
 *
 * Used when enumerating keys via a listing API that returns every key
 * in the shared backing store — the store must filter to keys it
 * owns and strip the prefix before returning them to the caller.
 *
 * @param prefix - The store's configured prefix.
 * @param key - The fully-qualified key from the backing store.
 * @returns The user-facing key, or `null` when the key does NOT
 *   belong to this prefix.
 */
export function stripPrefix(prefix: string, key: string): string | null {
  if (!prefix) return key;
  const full = `${prefix}:`;
  if (!Str.startsWith(key, full)) return null;
  return key.slice(full.length);
}
