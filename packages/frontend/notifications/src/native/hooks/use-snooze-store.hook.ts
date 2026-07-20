/**
 * @file use-snooze-store.hook.ts
 * @module @stackra/notifications/native/hooks
 * @description Client-side snooze registry for the native subpath.
 *
 *   The web equivalent persists to `localStorage`; on native, the
 *   analogous surface is AsyncStorage / `@stackra/storage`. To
 *   keep this first pass simple and dependency-free, the native
 *   snooze store is **in-memory only** — snoozes elapse when the
 *   app is fully restarted. When the app's backend ships a
 *   snooze endpoint, callers migrate to it and this hook is
 *   dropped in favour of the endpoint-backed reader.
 */

import { useCallback, useEffect, useState } from "react";

import { SNOOZE_PRESETS_MS } from "@/core/constants";
import type { SnoozePreset } from "@/core/interfaces";

/**
 * Return shape for the native
 * {@link useSnoozeStore} hook — mirrors the web hook's shape so
 * consumers of {@link useRenderableNotifications} stay
 * cross-platform.
 */
export interface IUseSnoozeStoreResult {
  /** Whether `id` is currently snoozed (deadline still ahead). */
  readonly isSnoozed: (id: string) => boolean;
  /** Snooze `id` for the given preset duration. */
  readonly snooze: (id: string, preset: SnoozePreset) => void;
  /** Snooze `id` until an explicit deadline. */
  readonly snoozeUntil: (id: string, until: Date) => void;
  /** Drop the snooze on `id` — no-op when it isn't snoozed. */
  readonly unsnooze: (id: string) => void;
  /** Clear every snooze. */
  readonly clearAll: () => void;
}

/** In-memory map keyed by notification id → deadline (ms). */
type SnoozeMap = Record<string, number>;

/** Drop entries whose deadline has already elapsed. Pure function. */
function pruneExpired(map: SnoozeMap, now: number): SnoozeMap {
  const next: SnoozeMap = {};
  for (const [id, until] of Object.entries(map)) {
    if (until > now) next[id] = until;
  }
  return next;
}

/**
 * Native snooze store — in-memory.
 *
 * @example
 * ```tsx
 * import { useSnoozeStore } from '@stackra/notifications/native';
 *
 * function Row({ id }: { id: string }) {
 *   const { isSnoozed, snooze } = useSnoozeStore();
 *   if (isSnoozed(id)) return null;
 *   return <PressableFeedback onPress={() => snooze(id, 'hour')} />;
 * }
 * ```
 */
export function useSnoozeStore(): IUseSnoozeStoreResult {
  const [store, setStore] = useState<SnoozeMap>({});

  // Re-prune every 60s to catch newly-elapsed deadlines — single
  // interval keeps the effect cost O(1) regardless of inbox size.
  useEffect(() => {
    const interval = setInterval(() => {
      setStore((current) => {
        const pruned = pruneExpired(current, Date.now());
        if (Object.keys(pruned).length === Object.keys(current).length) {
          // No-op — bail out to avoid a needless re-render.
          return current;
        }
        return pruned;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const isSnoozed = useCallback(
    (id: string): boolean => {
      const until = store[id];
      if (until === undefined) return false;
      return until > Date.now();
    },
    [store],
  );

  const snoozeUntil = useCallback((id: string, until: Date): void => {
    setStore((current) => ({ ...current, [id]: until.getTime() }));
  }, []);

  const snooze = useCallback(
    (id: string, preset: SnoozePreset): void => {
      const until = new Date(Date.now() + SNOOZE_PRESETS_MS[preset]);
      snoozeUntil(id, until);
    },
    [snoozeUntil],
  );

  const unsnooze = useCallback((id: string): void => {
    setStore((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback((): void => {
    setStore({});
  }, []);

  return { isSnoozed, snooze, snoozeUntil, unsnooze, clearAll };
}
