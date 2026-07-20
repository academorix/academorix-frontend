/**
 * @file cacheable.decorator.ts
 * @module @stackra/cache/core/decorators
 * @description Method decorator that automatically caches the return value.
 *   When applied to an async method, it wraps the method in a `remember()`
 *   pattern: if the cache has a value for the computed key, return it;
 *   otherwise execute the method, cache the result, and return it.
 *
 *   The cache key is built from the method name and serialized arguments,
 *   or from a custom key builder function.
 */

import { CacheManager } from "@/core/services/cache-manager.service";
import { CACHE_MANAGER } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

import type { ICacheableOptions } from "@/core/interfaces/cacheable-options.interface";

// ════════════════════════════════════════════════════════════════════════════════
// Container Reference
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Lazy container reference for resolving CacheManager at runtime.
 *
 * The decorator stores a reference and resolves it on first invocation.
 * This avoids circular dependency issues at decoration time.
 */
export let containerRef: { get: (token: any) => any } | null = null;

/**
 * Set the container reference for the @Cacheable decorator to use.
 *
 * Call this once during application bootstrap (after container is ready).
 * Without this, @Cacheable will execute the method without caching.
 *
 * @param container - The DI container with a `get()` method
 *
 * @example
 * ```typescript
 * // In main.ts or bootstrap:
 * import { setCacheableContainer } from '@stackra/cache';
 *
 * const app = await Application.create(AppModule);
 * setCacheableContainer(app);
 * ```
 */
export function setCacheableContainer(container: { get: (token: any) => any }): void {
  containerRef = container;
}

// ════════════════════════════════════════════════════════════════════════════════
// Decorator
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Method decorator that caches the return value automatically.
 *
 * Wraps the decorated method in a cache-aside pattern:
 * 1. Compute the cache key (from options or auto-generated)
 * 2. Check if the key exists in cache → return cached value
 * 3. If not cached, execute the original method
 * 4. Store the result in cache with the given TTL
 * 5. Return the result
 *
 * Requires the DI container to be set via `setCacheableContainer()` at boot.
 *
 * @param options - Caching configuration (key, ttl, store, tags, unless)
 * @returns A method decorator
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   // Auto-generated key: UserService.getProfile(123)
 *   @Cacheable({ ttl: 600 })
 *   async getProfile(userId: string): Promise<UserProfile> {
 *     return await this.db.findProfile(userId);
 *   }
 *
 *   // Custom key builder + tags
 *   @Cacheable({
 *     key: (id: string) => `user:${id}:permissions`,
 *     ttl: 300,
 *     tags: ['users', 'permissions'],
 *   })
 *   async getPermissions(userId: string): Promise<Permission[]> {
 *     return await this.rbac.getPermissionsForUser(userId);
 *   }
 *
 *   // Conditional caching — don't cache empty results
 *   @Cacheable({
 *     ttl: 60,
 *     unless: () => false, // custom logic
 *   })
 *   async search(query: string): Promise<SearchResult[]> {
 *     return await this.searchEngine.query(query);
 *   }
 * }
 * ```
 */
export function Cacheable(options: ICacheableOptions = {}): MethodDecorator {
  const ttl = options.ttl ?? 300;

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ): TypedPropertyDescriptor<any> {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);

    if (typeof originalMethod !== "function") {
      throw new Error(
        `@Cacheable() can only be applied to methods. ` + `"${methodName}" is not a function.`,
      );
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // If container not set, fall through to original method (no caching)
      if (!containerRef) {
        return originalMethod.apply(this, args);
      }

      // Check unless condition — bypass cache if it returns true
      if (options.unless && options.unless(...args)) {
        return originalMethod.apply(this, args);
      }

      // Resolve cache manager
      let manager: CacheManager;
      try {
        manager = containerRef.get(CACHE_MANAGER);
      } catch {
        // Can't resolve manager — fall through without caching
        return originalMethod.apply(this, args);
      }

      // Build the cache key
      const cacheKey = buildKey(options.key, className, methodName, args);

      // Get the store
      const store = manager.store(options.store);

      // If tags are specified, use TaggedCache
      if (options.tags && options.tags.length > 0) {
        const { TaggedCache } = await import("@/core/tags/tagged-cache");
        const tagged = new TaggedCache(store, options.tags);
        return tagged.remember(cacheKey, ttl, () => originalMethod.apply(this, args));
      }

      // Standard cache-aside via the store directly
      const cached = await store.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await store.set(cacheKey, result, ttl);
      return result;
    };

    // Preserve method name for debugging
    Object.defineProperty(descriptor.value, "name", {
      value: `cacheable(${methodName})`,
      configurable: true,
    });

    return descriptor;
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// Private Helpers
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Build the cache key from options or auto-generate.
 *
 * @param keyOption - The key option from decorator config
 * @param className - The class name
 * @param methodName - The method name
 * @param args - The method arguments
 * @returns The computed cache key string
 */
export function buildKey(
  keyOption: ICacheableOptions["key"],
  className: string,
  methodName: string,
  args: any[],
): string {
  if (typeof keyOption === "function") {
    return keyOption(...args);
  }

  if (typeof keyOption === "string") {
    return keyOption;
  }

  // Auto-generate: ClassName.methodName:serializedArgs
  const argsKey =
    args.length > 0
      ? ":" +
        args
          .map((a) => {
            try {
              return typeof a === "object" ? JSON.stringify(a) : String(a);
            } catch {
              return String(a);
            }
          })
          .join(",")
      : "";

  return `${className}.${methodName}${argsKey}`;
}
