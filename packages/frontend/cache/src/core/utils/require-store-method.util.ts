/**
 * @file require-store-method.util.ts
 * @module @stackra/cache/core/utils
 * @description Helper that validates an optional `ICacheStore` method is
 *   implemented by the configured store driver and returns it bound to the
 *   store instance. Throws a typed `CacheError` when the method is missing,
 *   making feature support gaps explicit instead of failing with a generic
 *   "undefined is not a function" runtime error.
 */

import { CacheError } from "@/core/errors/cache.error";
import type { ICacheStore } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Validate that a cache store implements the requested optional method and
 * return it bound to the store instance.
 *
 * The `ICacheStore` contract marks methods like `delete`, `clear`, `many`,
 * `setMany`, `forever`, `increment`, `decrement`, and `touch` as optional —
 * individual store drivers may omit them. This helper enforces support
 * at the call site by throwing a typed `CacheError` when the method is
 * missing, instead of letting the runtime throw a generic
 * `undefined is not a function` error.
 *
 * The returned function is pre-bound to the store, so callers can invoke
 * it directly without worrying about `this` context.
 *
 * @typeParam K - The optional method key on `ICacheStore`
 * @param store - The cache store to inspect
 * @param method - The method name to require
 * @returns The bound method, guaranteed to be callable
 * @throws {CacheError} When the store does not implement the requested method
 *
 * @example
 * ```typescript
 * const flush = requireStoreMethod(store, 'clear');
 * await flush();
 * ```
 *
 * @example
 * ```typescript
 * // Generic methods preserve their type parameters
 * const many = requireStoreMethod(store, 'many');
 * const results = await many<User>(['user:1', 'user:2']);
 * ```
 */
export function requireStoreMethod<K extends keyof ICacheStore>(
  store: ICacheStore,
  method: K,
): NonNullable<ICacheStore[K]> {
  const fn = store[method];

  if (typeof fn !== "function") {
    throw new CacheError(
      `Cache store does not implement "${String(method)}()". ` +
        `The configured store driver must support this operation.`,
      "CACHE_METHOD_UNSUPPORTED",
    );
  }

  return (fn as Function).bind(store) as NonNullable<ICacheStore[K]>;
}
