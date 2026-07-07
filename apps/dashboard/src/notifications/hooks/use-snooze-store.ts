/**
 * @file use-snooze-store.ts
 * @module notifications/hooks/use-snooze-store
 *
 * @description
 * `useSnoozeStore()` — client-side snooze registry backed by
 * `localStorage`. Rows in the drawer that are currently snoozed hide
 * from the "Unread" section until their timestamp elapses.
 *
 * ## Why client-side?
 *
 * Snooze is a per-device convenience — the backend has no snooze
 * endpoint yet (see the TODOs on the notifications package README).
 * Keeping the state in `localStorage`:
 *
 *   - Survives page reloads without a fetch.
 *   - Stays isolated per browser (a coach snoozing on their phone
 *     doesn't hide the row from the reception iPad).
 *   - Trivially clears on logout via {@link clearSnoozes}.
 *
 * When the backend ships `POST /notifications/{id}/snooze`, callers
 * migrate by writing to both this store AND the endpoint until the
 * endpoint stabilises, then drop this store entirely.
 *
 * TODO(backend-gap): `POST /notifications/{id}/snooze` — endpoint does
 *   NOT exist yet. See Communication module `routes/api.php`. Payload:
 *   `{ until: iso8601 }`. When it lands, prefer the server as source
 *   of truth and use this hook only as an offline cache.
 *
 * ## Shape on disk
 *
 * ```json
 * {
 *   "notif_01H...": "2026-01-15T22:00:00.000Z",
 *   "notif_02K...": "2026-01-16T08:00:00.000Z"
 * }
 * ```
 *
 * Keys are notification ids. Values are ISO-8601 wake-up timestamps.
 */

import { useCallback, useEffect, useState } from "react";

/** localStorage key. Namespaced so the entry is greppable. */
const STORAGE_KEY = "academorix:notifications:snoozes:v1";

/** In-memory shape of the snooze map. */
type SnoozeMap = Record<string, string>;

/** Snooze durations the drawer exposes as one-click options. */
export const SNOOZE_PRESETS = {
  hour: 60 * 60 * 1000,
  threeHours: 3 * 60 * 60 * 1000,
  tomorrow: 24 * 60 * 60 * 1000,
  nextWeek: 7 * 24 * 60 * 60 * 1000,
} as const;

/** Preset key union — narrows the API on the drawer's menu. */
export type SnoozePreset = keyof typeof SNOOZE_PRESETS;

/** Reads the raw JSON map from `localStorage`; returns `{}` on any error. */
function readStore(): SnoozeMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as SnoozeMap;
  } catch {
    // Corrupt storage — treat as empty rather than crashing the drawer.
    return {};
  }
}

/** Writes the map back to `localStorage`, swallowing quota errors. */
function writeStore(map: SnoozeMap): void {
  if (typeof window === "undefined") {
    return;
  }

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
    if (new Date(until).getTime() > now) {
      next[id] = until;
    }
  }

  return next;
}

/** Return shape of {@link useSnoozeStore}. */
export interface UseSnoozeStoreResult {
  /**
   * Returns `true` when `id` is currently snoozed. Reactive — the hook
   * re-renders as timestamps elapse (every 60 s) and when callers
   * mutate the store.
   */
  readonly isSnoozed: (id: string) => boolean;
  /**
   * Records a snooze deadline for `id`. Overwrites any existing entry.
   */
  readonly snooze: (id: string, preset: SnoozePreset) => void;
  /**
   * Records a snooze deadline for `id` at an arbitrary point in the
   * future. Used by tests + the (future) "Custom" preset.
   */
  readonly snoozeUntil: (id: string, until: Date) => void;
  /** Clears the snooze deadline for `id`, if any. */
  readonly clearSnooze: (id: string) => void;
  /** Wipes every snooze — call on logout. */
  readonly clearSnoozes: () => void;
}

/**
 * The snooze store hook. Kept UN-opinionated about the analytics side:
 * callers dispatch `notification_snoozed` telemetry themselves so the
 * hook stays a pure data store.
 *
 * @remarks
 * Uses `useState` (not `useSyncExternalStore`) because the map is
 * updated only by the current tab today — cross-tab sync would land
 * with a `storage` listener when the backend endpoint arrives.
 */
export function useSnoozeStore(): UseSnoozeStoreResult {
  // Prune expired entries on first read so the drawer never shows a
  // "snoozed" row whose deadline elapsed while the tab was closed.
  const [store, setStore] = useState<SnoozeMap>(() => pruneExpired(readStore(), Date.now()));

  // Re-prune every 60s to catch newly-elapsed deadlines. Doing this
  // in a single interval (rather than one timer per row) keeps the
  // effect cost O(1) regardless of inbox size.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setStore((current) => {
        const pruned = pruneExpired(current, Date.now());

        if (Object.keys(pruned).length === Object.keys(current).length) {
          return current; // No-op — bail out to avoid a needless re-render.
        }

        writeStore(pruned);

        return pruned;
      });
    }, 60_000);

    return (): void => {
      window.clearInterval(interval);
    };
  }, []);

  const isSnoozed = useCallback(
    (id: string): boolean => {
      const until = store[id];

      if (!until) {
        return false;
      }

      return new Date(until).getTime() > Date.now();
    },
    [store],
  );

  const snoozeUntil = useCallback((id: string, until: Date): void => {
    setStore((current) => {
      const next = { ...current, [id]: until.toISOString() };

      writeStore(next);

      return next;
    });
  }, []);

  const snooze = useCallback(
    (id: string, preset: SnoozePreset): void => {
      const until = new Date(Date.now() + SNOOZE_PRESETS[preset]);

      snoozeUntil(id, until);
    },
    [snoozeUntil],
  );

  const clearSnooze = useCallback((id: string): void => {
    setStore((current) => {
      if (!(id in current)) {
        return current;
      }

      const next = { ...current };

      delete next[id];
      writeStore(next);

      return next;
    });
  }, []);

  const clearSnoozes = useCallback((): void => {
    setStore(() => {
      writeStore({});

      return {};
    });
  }, []);

  return { isSnoozed, snooze, snoozeUntil, clearSnooze, clearSnoozes };
}
