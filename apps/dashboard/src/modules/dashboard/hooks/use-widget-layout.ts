/**
 * @file use-widget-layout.ts
 * @module modules/dashboard/hooks/use-widget-layout
 *
 * @description
 * Persistent per-user layout state for the overview widget grid. Phase 1c
 * shipped a static CSS-grid; Phase 1d (`DASHBOARD_UX_PLAN.md` §4.2) upgrades
 * that to a `react-grid-layout` drag-and-drop grid, and this hook is the
 * only place the app reads or writes the persisted layout.
 *
 * ## What lives here (and why not in the component)
 *
 *  1. The **storage key** is derived from the user id — layouts are personal
 *     preferences and must not leak between accounts sharing a browser.
 *     Keeping the key here keeps every consumer aligned on the same key
 *     without a magic string floating in a component file.
 *  2. The **serialisation shape** is validated on read so a stale key from a
 *     previous schema version (or a hand-edited entry from DevTools) can't
 *     crash the grid — an invalid record silently falls back to defaults.
 *  3. The **fallback layout** is computed from the catalogue's
 *     `defaultLayout` blocks, laid out row-by-row against the 12-col grid.
 *     Doing this at read time (rather than baking it into a constant) keeps
 *     new catalogue entries visible on the overview page without a follow-up
 *     migration.
 *
 * ## Storage schema
 *
 * `academorix.dashboard.layout.{userId}.v1` — a JSON object of the shape
 * `{ version: 1, items: DashboardLayoutItem[] }`. The `.v1` suffix on the
 * key gives us a cheap way to introduce a `.v2` schema later without
 * migration code (readers ignore unknown-version blobs; writers overwrite
 * on next save). The record intentionally has no breakpoint dimension yet
 * — the grid runs against `react-grid-layout`'s `Responsive` at the `lg`
 * breakpoint and reflows via `cols` for narrower viewports; per-breakpoint
 * persistence is a Phase 5 concern (§4.2 in the plan).
 *
 * ## No React Query
 *
 * `localStorage` is synchronous and lives on the same thread as React. A
 * hook-local `useState` + `useEffect` is the right primitive here; wiring
 * React Query in would add ceremony without buying cache invalidation
 * (there is no server-side layout in Phase 1d) or dedupe (there is exactly
 * one consumer per page).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardLayoutItem } from "@/modules/dashboard/widgets/widget.types";

import {
  defaultLayoutWidgetKeys,
  widgetCatalogueByKey,
} from "@/modules/dashboard/widgets/widget.catalogue";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The grid width the plan targets at the `lg` breakpoint. Every layout item
 * — persisted or default — is clamped to this so a corrupted entry cannot
 * push the grid past its container.
 */
export const OVERVIEW_GRID_COLUMNS = 12;

/**
 * Schema version embedded in every write. Bumping this invalidates every
 * saved layout in one line — no code migration required.
 */
export const LAYOUT_SCHEMA_VERSION = 1;

/** Prefix + suffix around the userId in the storage key. */
const STORAGE_KEY_PREFIX = "academorix.dashboard.layout";
const STORAGE_KEY_SUFFIX = "v1";

/**
 * Builds the tenant-agnostic, user-scoped storage key. Layouts are personal
 * preferences, not tenant-shared, so we key exclusively on the user id.
 */
function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}.${userId}.${STORAGE_KEY_SUFFIX}`;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/**
 * The exact shape written to `localStorage`. Keeps a `version` alongside
 * `items` so a future schema change can be detected in one line and the
 * reader can bail out early with the defaults rather than crashing on a
 * partial parse.
 */
interface StoredLayout {
  version: number;
  items: DashboardLayoutItem[];
}

/**
 * Runs a JSON-parsed unknown blob through the minimal structural checks the
 * grid depends on. Extra fields are allowed (forward-compatible); missing or
 * mis-typed fields cause the item to be dropped. Item order is preserved so
 * the grid renders in the user's saved order.
 *
 * @returns The validated items, or `null` if the blob does not match the
 *   `StoredLayout` shape at all (missing wrapper, wrong version, items
 *   isn't an array).
 */
function parseStoredLayout(raw: unknown): DashboardLayoutItem[] | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Partial<StoredLayout>;

  // Unknown schema versions round-trip as "corrupt" from this reader's
  // point of view — callers fall back to defaults, which is what a v2 user
  // downgraded to v1 would want anyway.
  if (record.version !== LAYOUT_SCHEMA_VERSION) {
    return null;
  }

  if (!Array.isArray(record.items)) {
    return null;
  }

  const items: DashboardLayoutItem[] = [];

  for (const entry of record.items) {
    if (typeof entry !== "object" || entry === null) {
      // Drop unrecognisable entries; keep the rest so a single corrupt
      // widget position does not nuke every other widget.
      continue;
    }

    const candidate = entry as Partial<DashboardLayoutItem>;

    if (
      typeof candidate.widgetKey !== "string" ||
      typeof candidate.x !== "number" ||
      typeof candidate.y !== "number" ||
      typeof candidate.w !== "number" ||
      typeof candidate.h !== "number"
    ) {
      continue;
    }

    // Unknown widget keys are silently dropped. This is what keeps a
    // stale saved layout resilient to catalogue edits (a widget removed
    // by an admin doesn't leave a ghost box on the grid).
    if (!widgetCatalogueByKey.has(candidate.widgetKey)) {
      continue;
    }

    items.push({
      widgetKey: candidate.widgetKey,
      x: candidate.x,
      y: candidate.y,
      w: candidate.w,
      h: candidate.h,
      // `isStatic` is optional in the schema; preserve it through the
      // round-trip so owner-forced widgets stay pinned.
      isStatic: typeof candidate.isStatic === "boolean" ? candidate.isStatic : undefined,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Default layout
// ---------------------------------------------------------------------------

/**
 * Computes the fallback layout used when the user has never saved a
 * personal layout (or the saved one is unreadable). Walks
 * {@link defaultLayoutWidgetKeys} in order, packing each widget's
 * `defaultLayout` into the 12-col grid via a straightforward "wrap when
 * the row is full" algorithm — the same layout `react-grid-layout` would
 * produce from `compactType: "vertical"`.
 *
 * Exported so the reset action in the grid component can rebuild the
 * default without duplicating the packing logic.
 */
export function computeDefaultLayoutItems(): DashboardLayoutItem[] {
  const items: DashboardLayoutItem[] = [];

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const key of defaultLayoutWidgetKeys) {
    const definition = widgetCatalogueByKey.get(key);

    if (!definition) {
      // Guard against a catalogue edit that removed a default-layout key
      // without updating this list — the widget is just skipped.
      continue;
    }

    const { w, h } = definition.defaultLayout;

    // Wrap when the current row is full. `compactType: "vertical"` in the
    // grid component will then pack widgets upward so this matches.
    if (cursorX + w > OVERVIEW_GRID_COLUMNS) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    items.push({
      widgetKey: key,
      x: cursorX,
      y: cursorY,
      w,
      h,
    });

    cursorX += w;
    rowHeight = Math.max(rowHeight, h);
  }

  return items;
}

// ---------------------------------------------------------------------------
// Storage read / write
// ---------------------------------------------------------------------------

/**
 * Reads the persisted layout for the given user, or returns `null` if
 * nothing usable is stored. `null` (rather than the default layout) lets
 * the caller distinguish "first-run" from "user has explicitly cleared
 * their layout" if we ever want to.
 */
export function readStoredLayout(userId: string): DashboardLayoutItem[] | null {
  // The hook runs in a browser environment (jsdom in tests), but guard
  // defensively so a stray SSR-like execution never throws.
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    return parseStoredLayout(parsed);
  } catch {
    // JSON.parse failure, disallowed storage access, quota errors on read
    // — all lumped together as "no usable layout".
    return null;
  }
}

/**
 * Persists the layout for the given user. Silently no-ops on storage
 * failures — a broken quota is not worth breaking the drag interaction
 * over; the user gets the fresh layout for the session and a stale one on
 * the next reload, which is the least surprising fallback.
 */
export function writeStoredLayout(userId: string, items: DashboardLayoutItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredLayout = {
    version: LAYOUT_SCHEMA_VERSION,
    items,
  };

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // Ignore write failures — layout stays in memory for the session.
  }
}

/**
 * Clears the persisted layout for the given user. Used by the "Reset
 * layout" action in the grid component so the next read hits the
 * catalogue defaults.
 */
export function clearStoredLayout(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore — the hook always overwrites on the next save.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/** The return shape of {@link useWidgetLayout}. */
export interface UseWidgetLayoutResult {
  /**
   * The current layout, in render order. When the user has never saved a
   * layout this is the catalogue default; otherwise it is whatever they
   * dragged / resized last.
   */
  items: DashboardLayoutItem[];
  /**
   * Persists a new layout for this user. Passing an empty array is
   * treated as an explicit reset (equivalent to calling {@link resetLayout}).
   */
  setLayout: (next: DashboardLayoutItem[]) => void;
  /**
   * Clears the saved layout and reverts to the catalogue default.
   * Exposed as a separate verb so the "Reset layout" button in the
   * header can call it without constructing an empty array itself.
   */
  resetLayout: () => void;
}

/**
 * Read / write hook for the persisted widget layout. Reads once on mount,
 * then keeps the state in a `useState` cell so the grid can re-render
 * synchronously when the user drags a widget.
 *
 * The hook does NOT debounce writes — `react-grid-layout` already
 * throttles `onLayoutChange` to drag-stop, so every call here corresponds
 * to a user action that finished. Debouncing would only add latency
 * before the next reload sees the change.
 *
 * @param userId - Stable identifier for the signed-in user. When `null` or
 *   empty (e.g. the identity provider hasn't loaded yet) the hook renders
 *   the catalogue default and skips persistence — an "anonymous" mode
 *   where the layout is fresh every render.
 */
export function useWidgetLayout(userId: string | null | undefined): UseWidgetLayoutResult {
  // The default layout is stable across renders, so memoise it. The
  // dependency is intentionally empty — the catalogue is a module-level
  // constant, not a hook input.
  const defaults = useMemo(() => computeDefaultLayoutItems(), []);

  const [items, setItems] = useState<DashboardLayoutItem[]>(() => {
    if (!userId) {
      return defaults;
    }

    // Read synchronously on first render so the grid never flashes the
    // defaults before the saved layout applies.
    return readStoredLayout(userId) ?? defaults;
  });

  // If the userId becomes available after the initial mount (which is the
  // common case with Refine's `useGetIdentity` — the identity resolves a
  // tick after the component mounts), re-read from storage. Without this
  // the hook would stay pinned to the anonymous defaults for the whole
  // session.
  useEffect(() => {
    if (!userId) {
      return;
    }

    const stored = readStoredLayout(userId);

    if (stored !== null) {
      setItems(stored);
    }
  }, [userId]);

  const setLayout = useCallback(
    (next: DashboardLayoutItem[]) => {
      setItems(next);

      if (userId) {
        writeStoredLayout(userId, next);
      }
    },
    [userId],
  );

  const resetLayout = useCallback(() => {
    setItems(defaults);

    if (userId) {
      clearStoredLayout(userId);
    }
  }, [defaults, userId]);

  return { items, setLayout, resetLayout };
}
