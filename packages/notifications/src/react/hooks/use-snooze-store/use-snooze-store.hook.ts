/**
 * @file use-snooze-store.hook.ts
 * @module @stackra/notifications/react/hooks
 * @description Client-side snooze registry backed by `localStorage`.
 *
 *   Rows in the drawer that are currently snoozed hide from the
 *   "Unread" section until their timestamp elapses. Consumers use
 *   the return value to gate row visibility in `useRenderableNotifications`.
 *
 *   Backed by `localStorage` on web — a per-device convenience. When
 *   the app's backend ships a snooze endpoint, callers migrate by
 *   writing to both this store AND the endpoint until the endpoint
 *   stabilises, then drop this store entirely.
 */

import { useCallback, useEffect, useState } from 'react';

import { SNOOZE_PRESETS_MS } from '@/core/constants';
import type { SnoozePreset } from '@/core/interfaces';
import type { IUseSnoozeStoreResult } from './use-snooze-store.interface';

/** localStorage key. Namespaced so the entry is greppable. */
const STORAGE_KEY = 'stackra:notifications:snoozes:v1';

/** In-memory shape of the snooze map. */
type SnoozeMap = Record<string, number>;

/** Reads the raw JSON map from `localStorage`; returns `{}` on any error. */
function readStore(): SnoozeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    // Filter out non-numeric values so a corrupt entry doesn't blow
    // up the isSnoozed comparison.
    const map: SnoozeMap = {};
    for (const [id, until] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof until === 'number' && Number.isFinite(until)) map[id] = until;
    }
    return map;
  } catch {
    // Corrupt storage — treat as empty rather than crashing the drawer.
    return {};
  }
}

/** Writes the map back to `localStorage`, swallowing quota errors. */
function writeStore(map: SnoozeMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full / disabled — silently degrade so the UI still ticks.
  }
}

/** Drops entries whose deadline has already elapsed. Pure function. */
function pruneExpired(map: SnoozeMap, now: number): SnoozeMap {
  const next: SnoozeMap = {};
  for (const [id, until] of Object.entries(map)) {
    if (until > now) next[id] = until;
  }
  return next;
}

/**
 * The snooze store hook.
 *
 * Uses `useState` (not `useSyncExternalStore`) because the map is
 * only mutated from the current tab today — cross-tab sync would
 * land with a `storage` listener when the backend endpoint arrives.
 *
 * @example
 * ```tsx
 * import { useSnoozeStore } from '@stackra/notifications/react';
 *
 * function Row({ id }: { id: string }) {
 *   const { isSnoozed, snooze } = useSnoozeStore();
 *   if (isSnoozed(id)) return null;
 *   return <button onClick={() => snooze(id, 'hour')}>Snooze</button>;
 * }
 * ```
 */
export function useSnoozeStore(): IUseSnoozeStoreResult {
  // Prune expired entries on first read so the drawer never shows a
  // "snoozed" row whose deadline elapsed while the tab was closed.
  const [store, setStore] = useState<SnoozeMap>(() => pruneExpired(readStore(), Date.now()));

  // Re-prune every 60s to catch newly-elapsed deadlines. Doing this
  // in a single interval (rather than one timer per row) keeps the
  // effect cost O(1) regardless of inbox size.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const interval = window.setInterval(() => {
      setStore((current) => {
        const pruned = pruneExpired(current, Date.now());
        if (Object.keys(pruned).length === Object.keys(current).length) {
          // No-op — bail out to avoid a needless re-render.
          return current;
        }
        writeStore(pruned);
        return pruned;
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const isSnoozed = useCallback(
    (id: string): boolean => {
      const until = store[id];
      if (until === undefined) return false;
      return until > Date.now();
    },
    [store]
  );

  const snoozeUntil = useCallback((id: string, until: Date): void => {
    setStore((current) => {
      const next = { ...current, [id]: until.getTime() };
      writeStore(next);
      return next;
    });
  }, []);

  const snooze = useCallback(
    (id: string, preset: SnoozePreset): void => {
      const until = new Date(Date.now() + SNOOZE_PRESETS_MS[preset]);
      snoozeUntil(id, until);
    },
    [snoozeUntil]
  );

  const unsnooze = useCallback((id: string): void => {
    setStore((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      writeStore(next);
      return next;
    });
  }, []);

  const clearAll = useCallback((): void => {
    setStore(() => {
      writeStore({});
      return {};
    });
  }, []);

  return { isSnoozed, snooze, snoozeUntil, unsnooze, clearAll };
}
