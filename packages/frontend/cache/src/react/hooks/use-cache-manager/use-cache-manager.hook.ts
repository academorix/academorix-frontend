/**
 * @file use-cache-manager.hook.ts
 * @module @stackra/cache/react/hooks
 * @description React hook for accessing the CacheManager from DI.
 *   Provides registry-level API for advanced operations like listing stores,
 *   registering custom drivers at runtime, or forgetting cached instances.
 *
 *   Prefer `useCache()` for everyday get/put operations. Reach for the
 *   manager only when you need the multi-store orchestration API.
 */

import { useInject } from "@stackra/container/react";

import { CacheManager } from "@/core/services/cache-manager.service";
import { CACHE_MANAGER } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Resolve the CacheManager inside a React component.
 *
 * The CacheManager provides multi-store orchestration:
 * - `manager.store('redis')` — access a specific named store
 * - `manager.extend('custom', () => new MyStore())` — register drivers
 * - `manager.getDefaultDriver()` — inspect configuration
 *
 * @returns The DI-managed CacheManager instance
 *
 * @example
 * ```typescript
 * function CacheAdmin() {
 *   const manager = useCacheManager();
 *
 *   const flushRedis = async () => {
 *     await manager.store('redis').clear();
 *   };
 *
 *   return <button onClick={flushRedis}>Flush Redis Cache</button>;
 * }
 * ```
 */
export function useCacheManager(): CacheManager {
  return useInject<CacheManager>(CACHE_MANAGER);
}
