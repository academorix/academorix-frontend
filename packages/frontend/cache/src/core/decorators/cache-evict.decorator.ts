/**
 * @file cache-evict.decorator.ts
 * @module @stackra/cache/core/decorators
 * @description Method decorator that evicts cache entries after method execution.
 *   When applied to an async method, it deletes the specified cache keys
 *   (or flushes tags) AFTER the method completes successfully.
 *
 *   Use this on mutation methods (create, update, delete) to invalidate
 *   stale cached data that was previously stored by `@Cacheable()`.
 */

import { CacheManager } from "@/core/services/cache-manager.service";
import { CACHE_MANAGER } from "@stackra/contracts";
import { requireStoreMethod } from "@/core/utils/require-store-method.util";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

import type { ICacheEvictOptions } from "@/core/interfaces/cache-evict-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Container Reference (shared with @Cacheable)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Lazy container reference. Uses the same ref as @Cacheable
 * (set via `setCacheableContainer()`).
 */
export let containerRef: { get: (token: any) => any } | null = null;

/**
 * Set the container reference for the @CacheEvict decorator.
 *
 * @param container - The DI container
 */
export function setCacheEvictContainer(container: { get: (token: any) => any }): void {
  containerRef = container;
}

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Method decorator that evicts cache entries on method invocation.
 *
 * Applied to mutation methods (create, update, delete) to invalidate
 * stale cached data. Supports:
 * - Key-based eviction (single or multiple keys)
 * - Tag-based eviction (flush all entries under tags)
 * - Full store flush (nuclear option)
 * - Before/after invocation timing
 *
 * @param options - Eviction configuration
 * @returns A method decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   // Evict specific key after update
 *   @CacheEvict({ keys: (id: string) => `user:${id}:profile` })
 *   async updateProfile(id: string, data: UpdateDto): Promise<User> {
 *     return await this.db.update(id, data);
 *   }
 *
 *   // Flush all user-tagged entries after bulk operation
 *   @CacheEvict({ tags: ['users'] })
 *   async importUsers(batch: User[]): Promise<void> {
 *     await this.db.bulkInsert(batch);
 *   }
 *
 *   // Evict before method (even if method throws)
 *   @CacheEvict({ keys: 'user:count', beforeInvocation: true })
 *   async deleteUser(id: string): Promise<void> {
 *     await this.db.delete(id);
 *   }
 * }
 * ```
 */
export function CacheEvict(options: ICacheEvictOptions): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);

    if (typeof originalMethod !== "function") {
      throw new Error(
        `@CacheEvict() can only be applied to methods. ` + `"${methodName}" is not a function.`,
      );
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // If container not set, fall through to original method
      if (!containerRef) {
        return originalMethod.apply(this, args);
      }

      let manager: CacheManager;
      try {
        manager = containerRef.get(CACHE_MANAGER);
      } catch {
        return originalMethod.apply(this, args);
      }

      // Evict before invocation if configured
      if (options.beforeInvocation) {
        await performEviction(manager, options, args);
      }

      // Execute the original method
      const result = await originalMethod.apply(this, args);

      // Evict after invocation (default)
      if (!options.beforeInvocation) {
        await performEviction(manager, options, args);
      }

      return result;
    };

    // Preserve method name
    Object.defineProperty(descriptor.value, "name", {
      value: `cacheEvict(${methodName})`,
      configurable: true,
    });

    return descriptor;
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// Private Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Perform the actual cache eviction based on options.
 *
 * @param manager - The CacheManager instance
 * @param options - Eviction options
 * @param args - Method arguments (for dynamic key/tag resolution)
 */
export async function performEviction(
  manager: CacheManager,
  options: ICacheEvictOptions,
  args: any[],
): Promise<void> {
  const store = manager.store(options.store);

  try {
    // Nuclear: flush entire store
    if (options.allEntries) {
      await requireStoreMethod(store, "clear")();
      return;
    }

    // Tag-based eviction
    if (options.tags) {
      const { TaggedCache } = await import("@/core/tags/tagged-cache");
      const tagNames = typeof options.tags === "function" ? options.tags(...args) : options.tags;
      const tagged = new TaggedCache(store, tagNames);
      await tagged.flush();
    }

    // Key-based eviction
    if (options.keys) {
      const resolvedKeys =
        typeof options.keys === "function" ? options.keys(...args) : options.keys;

      const keysArray = Array.isArray(resolvedKeys) ? resolvedKeys : [resolvedKeys];
      const deleteFn = requireStoreMethod(store, "delete");
      for (const key of keysArray) {
        await deleteFn(key);
      }
    }
  } catch {
    // Eviction failures are non-fatal — never break the method call
  }
}
