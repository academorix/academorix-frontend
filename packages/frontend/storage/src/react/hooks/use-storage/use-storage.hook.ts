/**
 * @file use-storage.hook.ts
 * @module @stackra/storage/react/hooks/use-storage
 * @description React hook returning a named `IStorage` from the
 *   DI-resolved `StorageManager`. Wraps `useInject` so consumers
 *   don't have to reach for the container directly.
 */

import { useMemo } from "react";
import { useInject } from "@stackra/container/react";
import { STORAGE_MANAGER, type IStorage, type IStorageManager } from "@stackra/contracts";

/**
 * Resolve a named `IStorage` instance.
 *
 * @param name - Optional instance name. When omitted, the manager's
 *   configured default is used.
 * @returns The named `IStorage`. The reference is memoised on
 *   `(manager, name)` so it stays stable across renders.
 *
 * @example
 * ```tsx
 * function Preferences() {
 *   const storage = useStorage('preferences');
 *   useEffect(() => { storage.get('theme').then(setTheme); }, [storage]);
 *   return null;
 * }
 * ```
 */
export function useStorage(name?: string): IStorage {
  const manager = useInject<IStorageManager>(STORAGE_MANAGER);
  return useMemo(() => manager.instance(name), [manager, name]);
}
