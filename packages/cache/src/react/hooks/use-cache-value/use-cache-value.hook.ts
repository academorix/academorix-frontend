/**
 * @file use-cache-value.hook.ts
 * @module @stackra/cache/react/hooks
 * @description React hook for subscribing a component to a single cache key.
 *   On mount, issues a read against the cache store. The component re-renders
 *   when the value resolves. Provides loading/error state and a `refresh()`
 *   function for manual re-fetching.
 *
 *   This hook is READ-ONLY by design. Use `useCache().set()` or
 *   `useCache().forget()` for write operations.
 */

import { useEffect, useState, useCallback } from "react";
import { useInject } from "@stackra/container/react";

import { CacheManager } from "@/core/services/cache-manager.service";
import { CACHE_MANAGER } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Return type for the useCacheValue hook.
 */
export interface IUseCacheValueResult<T> {
  /** The cached value (or defaultValue on miss). */
  data: T | undefined;
  /** Whether the cache read is in progress. */
  loading: boolean;
  /** Error if the cache read failed. */
  error: Error | undefined;
  /** Manually re-read the value from cache. */
  refresh: () => void;
}

// ════════════════════════════════════════════════════════════════════════════════
// Hook
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Subscribe a component to a single cache key.
 *
 * On mount (and on `key` change), reads the value from the cache store.
 * The component re-renders with the resolved value. Supports:
 * - Loading state tracking
 * - Error handling
 * - Manual refresh via `refresh()` function
 * - Custom default value on cache miss
 * - Named store override
 *
 * @typeParam T - The expected type of the cached value
 * @param key - The cache key to subscribe to
 * @param defaultValue - Value returned when the key is missing (optional)
 * @param options - Optional store name override
 * @returns Reactive result object with data, loading, error, and refresh
 *
 * @example
 * ```tsx
 * function CartBadge() {
 *   const { data, loading } = useCacheValue<number>('cart:count', 0);
 *
 *   if (loading) return <Spinner />;
 *   return <Badge value={data} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data: user, loading, refresh } = useCacheValue<User>(
 *     `user:${userId}`,
 *   );
 *
 *   return (
 *     <div>
 *       {loading ? <Skeleton /> : <Avatar src={user?.avatar} />}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCacheValue<T = unknown>(
  key: string,
  defaultValue?: T,
  options?: { store?: string },
): IUseCacheValueResult<T> {
  const manager = useInject<CacheManager>(CACHE_MANAGER);

  const [data, setData] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    const store = manager.store(options?.store);

    store
      .get<T>(key)
      .then((value: T | undefined) => {
        if (cancelled) return;
        setData(value !== undefined ? value : defaultValue);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshTick, options?.store]);

  const refresh = useCallback((): void => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  return { data, loading, error, refresh };
}
