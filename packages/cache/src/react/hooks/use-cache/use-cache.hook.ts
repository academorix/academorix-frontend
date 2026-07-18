/**
 * @file use-cache.hook.ts
 * @module @stackra/cache/react/hooks
 * @description React hook for accessing the CacheService from DI.
 *   Provides a convenient way to use cache operations in React components.
 */

import { useInject } from "@stackra/container/react";

import { CacheService } from "@/core/services/cache.service";

/**
 * Access the CacheService from the DI container in a React component.
 *
 * Returns the singleton CacheService instance which delegates to the
 * configured default cache store.
 *
 * @returns The CacheService instance
 *
 * @example
 * ```typescript
 * function UserProfile({ userId }: { userId: string }) {
 *   const cache = useCache();
 *
 *   useEffect(() => {
 *     cache.remember(`user:${userId}`, 300, () => fetchUser(userId))
 *       .then(setUser);
 *   }, [userId]);
 *
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
export function useCache(): CacheService {
  return useInject<CacheService>(CacheService);
}
