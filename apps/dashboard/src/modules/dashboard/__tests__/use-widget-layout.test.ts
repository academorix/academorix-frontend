/**
 * @file use-widget-layout.test.ts
 * @module modules/dashboard/__tests__/use-widget-layout.test
 *
 * @description
 * Unit coverage for the persistence layer of the overview widget grid
 * (`DASHBOARD_UX_PLAN.md` §4.2). The tests are split into two halves:
 *
 *   1. **Pure storage helpers** — `readStoredLayout` / `writeStoredLayout` /
 *      `computeDefaultLayoutItems`. Straight functions that read and write
 *      `localStorage`, easy to assert against without a React tree.
 *   2. **The `useWidgetLayout` hook** — exercised via `@testing-library/
 *      react`'s `renderHook`. Covers the mount-time read, the `setLayout`
 *      write path, and the `resetLayout` verb.
 *
 * We do NOT test `react-grid-layout` interop here — that lives in the grid
 * component's tests. The contract this hook has with the grid is a plain
 * array of items in / out; the grid's own layout-diffing is out of scope.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DashboardLayoutItem } from "@/modules/dashboard/widgets/widget.types";

import {
  LAYOUT_SCHEMA_VERSION,
  OVERVIEW_GRID_COLUMNS,
  clearStoredLayout,
  computeDefaultLayoutItems,
  readStoredLayout,
  useWidgetLayout,
  writeStoredLayout,
} from "@/modules/dashboard/hooks/use-widget-layout";
import { defaultLayoutWidgetKeys } from "@/modules/dashboard/widgets/widget.catalogue";

/** The user id every case uses — kept short so the storage key is readable. */
const USER_ID = "user-42";

/** Builds the storage key the hook actually writes to (kept private in the module). */
const STORAGE_KEY = `academorix.dashboard.layout.${USER_ID}.v1`;

/** Fully valid stub item — good default for tests that only tweak one field. */
function makeItem(overrides: Partial<DashboardLayoutItem> = {}): DashboardLayoutItem {
  return {
    widgetKey: "kpi-athletes",
    x: 0,
    y: 0,
    w: 3,
    h: 1,
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("computeDefaultLayoutItems", () => {
  it("packs widgets in catalogue order without overflowing 12 columns", () => {
    const items = computeDefaultLayoutItems();

    // Every default widget in the catalogue produces exactly one item.
    // Onboarding and lists are in the default set — see
    // `defaultLayoutWidgetKeys` in the catalogue.
    expect(items).toHaveLength(defaultLayoutWidgetKeys.length);

    for (const item of items) {
      expect(item.x + item.w).toBeLessThanOrEqual(OVERVIEW_GRID_COLUMNS);
    }
  });

  it("assigns the first widget to (0, 0)", () => {
    const [first] = computeDefaultLayoutItems();

    expect(first).toBeDefined();
    expect(first?.x).toBe(0);
    expect(first?.y).toBe(0);
  });

  it("wraps to a new row when the current row is full", () => {
    // The default set contains a 12-wide onboarding checklist followed by
    // four 3-wide KPIs. The onboarding checklist takes its own row (y=0),
    // then the KPIs pack across the next row (y=2, since the banner is 2
    // rows tall).
    const items = computeDefaultLayoutItems();

    const banner = items.find((item) => item.widgetKey === "onboarding-checklist");
    const firstKpi = items.find((item) => item.widgetKey === "kpi-athletes");

    expect(banner?.y).toBe(0);
    // The KPIs come after the banner, so their `y` should not overlap.
    expect(firstKpi?.y).toBeGreaterThanOrEqual(2);
  });
});

describe("readStoredLayout", () => {
  it("returns null when no value is stored for the user", () => {
    expect(readStoredLayout(USER_ID)).toBeNull();
  });

  it("returns the parsed items when the stored blob matches the schema", () => {
    const items: DashboardLayoutItem[] = [makeItem({ widgetKey: "kpi-teams", x: 3, w: 3 })];

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: LAYOUT_SCHEMA_VERSION, items }),
    );

    expect(readStoredLayout(USER_ID)).toEqual(items);
  });

  it("returns null when the JSON is corrupt (parse failure)", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not-json}");

    expect(readStoredLayout(USER_ID)).toBeNull();
  });

  it("returns null when the wrapper is missing (unrecognised schema)", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([makeItem()]));

    expect(readStoredLayout(USER_ID)).toBeNull();
  });

  it("returns null for an unknown schema version (forward-compat guard)", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, items: [makeItem()] }));

    expect(readStoredLayout(USER_ID)).toBeNull();
  });

  it("silently drops entries with the wrong shape", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [
          makeItem({ widgetKey: "kpi-athletes" }),
          // Missing `w` and `h` — dropped.
          { widgetKey: "kpi-teams", x: 3, y: 0 },
          // Wrong type on `x` — dropped.
          { widgetKey: "kpi-events", x: "0", y: 0, w: 3, h: 1 },
        ],
      }),
    );

    const items = readStoredLayout(USER_ID);

    expect(items).toHaveLength(1);
    expect(items?.[0]?.widgetKey).toBe("kpi-athletes");
  });

  it("silently drops entries whose widgetKey is not in the catalogue", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [
          makeItem({ widgetKey: "kpi-athletes" }),
          // Bogus widget id (retired / renamed) — dropped without a crash.
          makeItem({ widgetKey: "some-widget-that-was-removed" }),
        ],
      }),
    );

    const items = readStoredLayout(USER_ID);

    expect(items).toHaveLength(1);
    expect(items?.[0]?.widgetKey).toBe("kpi-athletes");
  });

  it("preserves an optional isStatic flag when present on the stored entry", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [makeItem({ widgetKey: "kpi-athletes", isStatic: true })],
      }),
    );

    expect(readStoredLayout(USER_ID)?.[0]?.isStatic).toBe(true);
  });
});

describe("writeStoredLayout + clearStoredLayout", () => {
  it("writes a wrapped payload under the user-scoped key", () => {
    const items = [makeItem({ widgetKey: "kpi-athletes", x: 0, w: 3 })];

    writeStoredLayout(USER_ID, items);

    const raw = window.localStorage.getItem(STORAGE_KEY);

    expect(raw).not.toBeNull();

    // Confirms the on-disk shape has both a version and items — a v2
    // migration will read the same key and can detect this v1 payload.
    const parsed = JSON.parse(raw ?? "{}") as { version: number; items: DashboardLayoutItem[] };

    expect(parsed.version).toBe(LAYOUT_SCHEMA_VERSION);
    expect(parsed.items).toEqual(items);
  });

  it("round-trips through readStoredLayout without data loss", () => {
    const items = [
      makeItem({ widgetKey: "kpi-athletes", x: 0, y: 0 }),
      makeItem({ widgetKey: "kpi-coaches", x: 3, y: 0 }),
    ];

    writeStoredLayout(USER_ID, items);

    expect(readStoredLayout(USER_ID)).toEqual(items);
  });

  it("clearStoredLayout removes the entry", () => {
    writeStoredLayout(USER_ID, [makeItem()]);

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearStoredLayout(USER_ID);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(readStoredLayout(USER_ID)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The hook itself
// ---------------------------------------------------------------------------

describe("useWidgetLayout", () => {
  it("returns the default layout when nothing is stored", () => {
    const { result } = renderHook(() => useWidgetLayout(USER_ID));

    expect(result.current.items).toEqual(computeDefaultLayoutItems());
  });

  it("returns the stored layout when one is present at mount", () => {
    const stored = [makeItem({ widgetKey: "kpi-events", x: 0, y: 0 })];

    writeStoredLayout(USER_ID, stored);

    const { result } = renderHook(() => useWidgetLayout(USER_ID));

    expect(result.current.items).toEqual(stored);
  });

  it("falls back to defaults when the stored value is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{malformed");

    const { result } = renderHook(() => useWidgetLayout(USER_ID));

    expect(result.current.items).toEqual(computeDefaultLayoutItems());
  });

  it("persists layout writes to localStorage under the user key", () => {
    const { result } = renderHook(() => useWidgetLayout(USER_ID));

    const next = [makeItem({ widgetKey: "kpi-athletes", x: 3, y: 0 })];

    act(() => {
      result.current.setLayout(next);
    });

    // The hook state reflects the write.
    expect(result.current.items).toEqual(next);

    // And the persistence layer sees the same payload on the next read.
    expect(readStoredLayout(USER_ID)).toEqual(next);
  });

  it("resetLayout drops the persisted entry and returns to defaults", () => {
    writeStoredLayout(USER_ID, [makeItem({ widgetKey: "kpi-athletes", x: 6 })]);

    const { result } = renderHook(() => useWidgetLayout(USER_ID));

    // Sanity check — the hook picked up the persisted layout.
    expect(result.current.items?.[0]?.x).toBe(6);

    act(() => {
      result.current.resetLayout();
    });

    expect(result.current.items).toEqual(computeDefaultLayoutItems());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("renders the anonymous defaults when userId is null (identity not resolved)", () => {
    const { result } = renderHook(() => useWidgetLayout(null));

    expect(result.current.items).toEqual(computeDefaultLayoutItems());

    // Writes with a null user id must not touch storage (no key to write to).
    act(() => {
      result.current.setLayout([makeItem()]);
    });

    // The hook's in-memory state reflects the update, but nothing hit
    // localStorage — the null userId keeps the layout ephemeral.
    expect(result.current.items).toEqual([makeItem()]);
    expect(window.localStorage.length).toBe(0);
  });

  it("promotes a saved layout when userId resolves after mount", () => {
    // Write BEFORE the hook mounts under the eventual id — this mimics the
    // "Refine identity resolves a tick after the page renders" scenario.
    writeStoredLayout(USER_ID, [makeItem({ widgetKey: "kpi-events", x: 9 })]);

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useWidgetLayout(id),
      {
        initialProps: { id: null as string | null },
      },
    );

    // Anonymous mount — defaults.
    expect(result.current.items).toEqual(computeDefaultLayoutItems());

    rerender({ id: USER_ID });

    // After the id lands, the effect reads the persisted layout in.
    expect(result.current.items?.[0]?.widgetKey).toBe("kpi-events");
  });
});
