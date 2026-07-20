/**
 * @file use-widget-layout.hook.ts
 * @module @stackra/dashboard/react/hooks/use-widget-layout
 * @description Persistent per-user layout state for the overview
 *   widget grid.
 *
 *   ## What lives here
 *
 *   1. The **storage key** derived from the user id — layouts are
 *      personal preferences and must not leak between accounts.
 *   2. The **serialisation shape** validated on read so a stale key
 *      from a previous schema version can't crash the grid.
 *   3. The **fallback layout** computed from the catalogue's default
 *      `defaultLayout` blocks, laid out row-by-row against the 12-col
 *      grid. Doing this at read time (rather than baking it into a
 *      constant) keeps new catalogue entries visible on the overview
 *      page without a follow-up migration.
 *
 *   ## Storage schema
 *
 *   `academorix.dashboard.layout.{userId}.v1` — JSON of the shape
 *   `{ version: 1, items: IDashboardLayoutItem[] }`. The `.v1` suffix
 *   on the key gives us a cheap way to introduce a `.v2` schema later
 *   without migration code (readers ignore unknown-version blobs;
 *   writers overwrite on next save).
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { GRID_COLUMNS } from "@/core/constants/grid-columns.constants";
import type { IDashboardLayoutItem } from "@/core/interfaces/dashboard-layout-item.interface";
import type { IWidgetDefinition } from "@/core/interfaces/widget-definition.interface";

import type { IUseWidgetLayoutResult } from "./use-widget-layout.interface";

// ── Constants ──────────────────────────────────────────────────────────

/**
 * Grid width the overview targets at the `lg` breakpoint. Every
 * layout item — persisted or default — is clamped to this so a
 * corrupted entry can't push the grid past its container.
 */
export const OVERVIEW_GRID_COLUMNS = GRID_COLUMNS.lg;

/**
 * Schema version embedded in every write. Bumping this invalidates
 * every saved layout in one line — no code migration required.
 */
export const LAYOUT_SCHEMA_VERSION = 1;

/** Storage-key prefix / suffix around the user id. */
const STORAGE_KEY_PREFIX = "academorix.dashboard.layout";
const STORAGE_KEY_SUFFIX = "v1";

/**
 * Configuration passed to {@link useWidgetLayout}. Kept as an object
 * argument so the hook stays independent of any specific catalogue
 * implementation — the app injects the legacy grid catalogue's
 * `defaultLayoutWidgetKeys` + a `catalogueByKey` map, and the hook
 * builds everything else on top.
 */
export interface IUseWidgetLayoutOptions {
  /** Stable identifier for the signed-in user. */
  userId: string | null | undefined;

  /** Widget catalogue keys the default layout ships with. */
  defaultLayoutWidgetKeys: readonly string[];

  /** Legacy grid catalogue keyed by widget key. */
  catalogueByKey: ReadonlyMap<string, IWidgetDefinition>;
}

/**
 * Build the tenant-agnostic, user-scoped storage key. Layouts are
 * personal preferences, not tenant-shared, so we key exclusively on
 * the user id.
 *
 * @param userId - Stable user id.
 * @returns Fully-qualified storage key.
 */
function storageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}.${userId}.${STORAGE_KEY_SUFFIX}`;
}

// ── Serialisation ──────────────────────────────────────────────────────

/** Persisted shape written to localStorage. */
interface StoredLayout {
  version: number;
  items: IDashboardLayoutItem[];
}

/**
 * Run a JSON-parsed unknown blob through the minimal structural
 * checks the grid depends on.
 *
 * @param raw - Parsed JSON blob.
 * @param catalogueByKey - Legacy grid catalogue used to drop entries
 *   whose widget was removed from the catalogue.
 * @returns The validated items, or `null` if the blob does not match
 *   the {@link StoredLayout} shape.
 */
function parseStoredLayout(
  raw: unknown,
  catalogueByKey: ReadonlyMap<string, IWidgetDefinition>,
): IDashboardLayoutItem[] | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const record = raw as Partial<StoredLayout>;

  // Unknown schema versions round-trip as "corrupt" from this
  // reader's point of view — callers fall back to defaults.
  if (record.version !== LAYOUT_SCHEMA_VERSION) {
    return null;
  }

  if (!Array.isArray(record.items)) {
    return null;
  }

  const items: IDashboardLayoutItem[] = [];

  for (const entry of record.items) {
    if (typeof entry !== "object" || entry === null) {
      // Drop unrecognisable entries; keep the rest so a single
      // corrupt widget position doesn't nuke every other widget.
      continue;
    }

    const candidate = entry as Partial<IDashboardLayoutItem>;

    if (
      typeof candidate.widgetKey !== "string" ||
      typeof candidate.x !== "number" ||
      typeof candidate.y !== "number" ||
      typeof candidate.w !== "number" ||
      typeof candidate.h !== "number"
    ) {
      continue;
    }

    // Unknown widget keys are silently dropped. This keeps a stale
    // saved layout resilient to catalogue edits.
    if (!catalogueByKey.has(candidate.widgetKey)) {
      continue;
    }

    items.push({
      widgetKey: candidate.widgetKey,
      x: candidate.x,
      y: candidate.y,
      w: candidate.w,
      h: candidate.h,
      // `isStatic` is optional — preserve when present so
      // owner-forced widgets stay pinned across a round-trip.
      isStatic: typeof candidate.isStatic === "boolean" ? candidate.isStatic : undefined,
    });
  }

  return items;
}

// ── Default layout ─────────────────────────────────────────────────────

/**
 * Compute the fallback layout used when the user has never saved a
 * personal layout (or the saved one is unreadable).
 *
 * @param defaultLayoutWidgetKeys - Ordered catalogue keys to seed.
 * @param catalogueByKey - Legacy grid catalogue.
 * @returns Auto-laid-out items packed against the 12-col grid.
 */
export function computeDefaultLayoutItems(
  defaultLayoutWidgetKeys: readonly string[],
  catalogueByKey: ReadonlyMap<string, IWidgetDefinition>,
): IDashboardLayoutItem[] {
  const items: IDashboardLayoutItem[] = [];

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const key of defaultLayoutWidgetKeys) {
    const definition = catalogueByKey.get(key);

    if (!definition) {
      // Guard against a catalogue edit that removed a default-layout
      // key without updating this list — skip silently.
      continue;
    }

    const { w, h } = definition.defaultLayout;

    // Wrap when the current row is full. `compactType: "vertical"` in
    // the grid component will then pack widgets upward.
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

// ── Storage read / write ───────────────────────────────────────────────

/**
 * Read the persisted layout for the given user, or return `null` if
 * nothing usable is stored. `null` (rather than the default layout)
 * lets the caller distinguish "first-run" from "user explicitly
 * cleared their layout".
 *
 * @param userId - Stable user id.
 * @param catalogueByKey - Legacy grid catalogue used to prune
 *   entries whose widget is no longer catalogued.
 * @returns Persisted items, or `null` when unusable.
 */
export function readStoredLayout(
  userId: string,
  catalogueByKey: ReadonlyMap<string, IWidgetDefinition>,
): IDashboardLayoutItem[] | null {
  // The hook runs in a browser environment; guard defensively so a
  // stray SSR-like execution never throws.
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));

    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;

    return parseStoredLayout(parsed, catalogueByKey);
  } catch {
    // JSON.parse failure / disallowed storage access / quota errors on
    // read — all lumped together as "no usable layout".
    return null;
  }
}

/**
 * Persist the layout for the given user. Silently no-ops on storage
 * failures — a broken quota isn't worth breaking the drag interaction
 * over; the user gets the fresh layout for the session and a stale
 * one on the next reload, which is the least surprising fallback.
 *
 * @param userId - Stable user id.
 * @param items - Layout items to persist.
 */
export function writeStoredLayout(userId: string, items: IDashboardLayoutItem[]): void {
  if (typeof window === "undefined") return;

  const payload: StoredLayout = {
    version: LAYOUT_SCHEMA_VERSION,
    items,
  };

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // fail-soft — layout stays in memory for the session.
  }
}

/**
 * Clear the persisted layout for the given user. Used by the
 * "Reset layout" action so the next read hits the catalogue
 * defaults.
 *
 * @param userId - Stable user id.
 */
export function clearStoredLayout(userId: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // fail-soft — the hook always overwrites on the next save.
  }
}

// ── Hook ──────────────────────────────────────────────────────────────

/**
 * Read / write hook for the persisted widget layout. Reads once on
 * mount, then keeps the state in a `useState` cell so the grid can
 * re-render synchronously when the user drags a widget.
 *
 * The hook does NOT debounce writes — `react-grid-layout` already
 * throttles `onLayoutChange` to drag-stop, so every call here
 * corresponds to a finished user action.
 *
 * @param options - `userId` + catalogue accessors.
 * @returns Layout state + mutators.
 *
 * @example
 * ```typescript
 * import { useWidgetLayout } from '@stackra/dashboard/react';
 *
 * const { items, setLayout } = useWidgetLayout({
 *   userId: identity?.id,
 *   defaultLayoutWidgetKeys,
 *   catalogueByKey,
 * });
 * ```
 */
export function useWidgetLayout(options: IUseWidgetLayoutOptions): IUseWidgetLayoutResult {
  const { userId, defaultLayoutWidgetKeys, catalogueByKey } = options;

  // Memo the default layout — it's stable across renders of the
  // same catalogue input.
  const defaults = useMemo(
    () => computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    [defaultLayoutWidgetKeys, catalogueByKey],
  );

  const [items, setItems] = useState<IDashboardLayoutItem[]>(() => {
    if (!userId) {
      return defaults;
    }

    // Read synchronously on first render so the grid never flashes
    // the defaults before the saved layout applies.
    return readStoredLayout(userId, catalogueByKey) ?? defaults;
  });

  // If the userId becomes available after the initial mount (which
  // is the common case with identity that resolves a tick after
  // component mount), re-read from storage. Without this the hook
  // would stay pinned to the anonymous defaults for the whole
  // session.
  useEffect(() => {
    if (!userId) return;

    const stored = readStoredLayout(userId, catalogueByKey);

    if (stored !== null) {
      setItems(stored);
    }
  }, [userId, catalogueByKey]);

  const setLayout = useCallback(
    (next: IDashboardLayoutItem[]) => {
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
