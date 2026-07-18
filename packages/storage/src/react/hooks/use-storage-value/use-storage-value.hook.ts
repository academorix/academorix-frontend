/**
 * @file use-storage-value.hook.ts
 * @module @stackra/storage/react/hooks/use-storage-value
 * @description React hook that subscribes a component to one
 *   storage key. Initial read is asynchronous; every write also
 *   flushes to the backing store.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { useStorage } from '@/react/hooks/use-storage/use-storage.hook';

import type {
  UseStorageValueMeta,
  UseStorageValueOptions,
  UseStorageValueResult,
} from './use-storage-value.interface';

/**
 * Bind a React component's state to a storage key.
 *
 * The hook performs an async read on mount (returning `initialValue`
 * — default `null` — until it completes) and re-writes to the
 * backing store whenever the setter is called. Errors from the
 * backing driver never throw — they surface in the `meta.error`
 * field alongside a `null` value.
 *
 * @typeParam T - Value type.
 * @param key - The storage key.
 * @param options - Optional bag: `instance`, `initialValue`,
 *   `ttlSeconds`.
 * @returns `[value, setValue, meta]`.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const [theme, setTheme] = useStorageValue<string>('theme', {
 *     instance: 'preferences',
 *     initialValue: 'light',
 *   });
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Switch to {theme === 'dark' ? 'light' : 'dark'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useStorageValue<T>(
  key: string,
  options: UseStorageValueOptions<T> = {}
): UseStorageValueResult<T> {
  const storage = useStorage(options.instance);
  const initialValue = (options.initialValue ?? null) as T | null;

  const [value, setValue] = useState<T | null>(initialValue);
  const [meta, setMeta] = useState<UseStorageValueMeta>({ isLoading: true, error: null });

  // Track the latest render's options so the setter never captures a
  // stale ttl / instance across re-renders.
  const ttlRef = useRef<number | undefined>(options.ttlSeconds);
  ttlRef.current = options.ttlSeconds;

  // Initial read — runs whenever storage or key changes.
  useEffect(() => {
    let cancelled = false;

    setMeta({ isLoading: true, error: null });

    storage
      .get<T>(key)
      .then((next) => {
        // Ordering guard: a fast re-mount with a different key must
        // not overwrite state from the new mount with the previous
        // mount's value.
        if (cancelled) return;
        setValue(next);
        setMeta({ isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setValue(initialValue);
        setMeta({
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      cancelled = true;
    };
    // initialValue intentionally excluded — a caller changing its
    // default should not re-trigger a fresh read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, key]);

  // Setter that writes through to the backing store then updates
  // local state. On write failure the local state still updates —
  // otherwise the UI would appear frozen while the driver refuses.
  const write = useCallback(
    (next: T | null): void => {
      setValue(next);
      const ttl = ttlRef.current;
      const writePromise =
        next === null
          ? storage.delete(key)
          : storage.set(key, next, ttl !== undefined ? { ttlSeconds: ttl } : undefined);

      writePromise
        .then(() => setMeta({ isLoading: false, error: null }))
        .catch((err: unknown) => {
          setMeta({
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        });
    },
    [storage, key]
  );

  return [value, write, meta] as const;
}
