/**
 * @file use-widget-layout.spec.ts
 * @module @stackra/dashboard/tests
 * @description Unit coverage for the persistence layer of the overview
 *   widget grid.
 *
 *   The tests are split into two halves:
 *
 *   1. **Pure storage helpers** — `readStoredLayout` / `writeStoredLayout` /
 *      `computeDefaultLayoutItems`. Straight functions that read + write
 *      `localStorage`, easy to assert against without a React tree.
 *   2. **The `useWidgetLayout` hook** — exercised via `renderHook`.
 *      Covers the mount-time read, the `setLayout` write path, and the
 *      `resetLayout` verb.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { IDashboardLayoutItem } from "@/core/interfaces/dashboard-layout-item.interface";
import type { IWidgetDefinition } from "@/core/interfaces/widget-definition.interface";
import {
  LAYOUT_SCHEMA_VERSION,
  OVERVIEW_GRID_COLUMNS,
  clearStoredLayout,
  computeDefaultLayoutItems,
  readStoredLayout,
  useWidgetLayout,
  writeStoredLayout,
} from "@/react/hooks/use-widget-layout";

/** The user id every case uses — kept short so the storage key is readable. */
const USER_ID = "user-42";

/** Storage key the hook writes to (kept private in the module). */
const STORAGE_KEY = `stackra.dashboard.layout.${USER_ID}.v1`;

/**
 * Small stub catalogue. Only three widgets — enough to exercise the
 * packing algorithm without pulling in the full app catalogue.
 */
function makeCatalogue(): {
  defaultLayoutWidgetKeys: readonly string[];
  catalogueByKey: ReadonlyMap<string, IWidgetDefinition>;
} {
  const definitions: IWidgetDefinition[] = [
    {
      key: "onboarding-checklist",
      title: "Setup checklist",
      description: "Track workspace setup.",
      category: "onboarding",
      sourceResource: "dashboard",
      defaultWidth: 3,
      defaultHeight: 2,
      defaultLayout: { w: 12, h: 2, minW: 6, minH: 2, maxW: 12, maxH: 3 },
      isAvailable: true,
    },
    {
      key: "kpi-athletes",
      title: "Athletes",
      description: "Total registered athletes.",
      category: "numbers",
      sourceResource: "athletes",
      defaultWidth: 1,
      defaultHeight: 1,
      defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
      isAvailable: true,
    },
    {
      key: "kpi-coaches",
      title: "Coaches",
      description: "Total coaches assigned.",
      category: "numbers",
      sourceResource: "coaches",
      defaultWidth: 1,
      defaultHeight: 1,
      defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
      isAvailable: true,
    },
  ];

  return {
    defaultLayoutWidgetKeys: definitions.map((entry) => entry.key),
    catalogueByKey: new Map(definitions.map((entry) => [entry.key, entry])),
  };
}

/** Fully-valid stub item — good default for tests that tweak one field. */
function makeItem(overrides: Partial<IDashboardLayoutItem> = {}): IDashboardLayoutItem {
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

// ── Pure helpers ─────────────────────────────────────────────────────

describe("computeDefaultLayoutItems", () => {
  it("packs widgets in catalogue order without overflowing 12 columns", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const items = computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey);

    expect(items).toHaveLength(defaultLayoutWidgetKeys.length);

    for (const item of items) {
      expect(item.x + item.w).toBeLessThanOrEqual(OVERVIEW_GRID_COLUMNS);
    }
  });

  it("assigns the first widget to (0, 0)", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const [first] = computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey);

    expect(first).toBeDefined();
    expect(first?.x).toBe(0);
    expect(first?.y).toBe(0);
  });

  it("wraps to a new row when the current row is full", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const items = computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey);

    const banner = items.find((item) => item.widgetKey === "onboarding-checklist");
    const firstKpi = items.find((item) => item.widgetKey === "kpi-athletes");

    expect(banner?.y).toBe(0);
    // The KPIs land after the banner, so their `y` shouldn't overlap.
    expect(firstKpi?.y).toBeGreaterThanOrEqual(2);
  });
});

describe("readStoredLayout", () => {
  it("returns null when no value is stored for the user", () => {
    const { catalogueByKey } = makeCatalogue();

    expect(readStoredLayout(USER_ID, catalogueByKey)).toBeNull();
  });

  it("returns the parsed items when the stored blob matches the schema", () => {
    const { catalogueByKey } = makeCatalogue();
    const items: IDashboardLayoutItem[] = [makeItem({ widgetKey: "kpi-coaches", x: 3, w: 3 })];

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: LAYOUT_SCHEMA_VERSION, items }),
    );

    expect(readStoredLayout(USER_ID, catalogueByKey)).toEqual(items);
  });

  it("returns null when the JSON is corrupt", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(STORAGE_KEY, "{not-json}");

    expect(readStoredLayout(USER_ID, catalogueByKey)).toBeNull();
  });

  it("returns null when the wrapper is missing (unrecognised schema)", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([makeItem()]));

    expect(readStoredLayout(USER_ID, catalogueByKey)).toBeNull();
  });

  it("returns null for an unknown schema version", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, items: [makeItem()] }));

    expect(readStoredLayout(USER_ID, catalogueByKey)).toBeNull();
  });

  it("silently drops entries with the wrong shape", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [
          makeItem({ widgetKey: "kpi-athletes" }),
          // Missing `w` and `h` — dropped.
          { widgetKey: "kpi-coaches", x: 3, y: 0 },
          // Wrong type on `x` — dropped.
          { widgetKey: "kpi-teams", x: "0", y: 0, w: 3, h: 1 },
        ],
      }),
    );

    const items = readStoredLayout(USER_ID, catalogueByKey);

    expect(items).toHaveLength(1);
    expect(items?.[0]?.widgetKey).toBe("kpi-athletes");
  });

  it("silently drops entries whose widgetKey is not in the catalogue", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [makeItem({ widgetKey: "kpi-athletes" }), makeItem({ widgetKey: "removed-widget" })],
      }),
    );

    const items = readStoredLayout(USER_ID, catalogueByKey);

    expect(items).toHaveLength(1);
    expect(items?.[0]?.widgetKey).toBe("kpi-athletes");
  });

  it("preserves an optional isStatic flag when present", () => {
    const { catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        items: [makeItem({ widgetKey: "kpi-athletes", isStatic: true })],
      }),
    );

    expect(readStoredLayout(USER_ID, catalogueByKey)?.[0]?.isStatic).toBe(true);
  });
});

describe("writeStoredLayout + clearStoredLayout", () => {
  it("writes a wrapped payload under the user-scoped key", () => {
    const items = [makeItem({ widgetKey: "kpi-athletes", x: 0, w: 3 })];

    writeStoredLayout(USER_ID, items);

    const raw = window.localStorage.getItem(STORAGE_KEY);

    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw ?? "{}") as {
      version: number;
      items: IDashboardLayoutItem[];
    };

    expect(parsed.version).toBe(LAYOUT_SCHEMA_VERSION);
    expect(parsed.items).toEqual(items);
  });

  it("round-trips through readStoredLayout without data loss", () => {
    const { catalogueByKey } = makeCatalogue();
    const items = [
      makeItem({ widgetKey: "kpi-athletes", x: 0, y: 0 }),
      makeItem({ widgetKey: "kpi-coaches", x: 3, y: 0 }),
    ];

    writeStoredLayout(USER_ID, items);

    expect(readStoredLayout(USER_ID, catalogueByKey)).toEqual(items);
  });

  it("clearStoredLayout removes the entry", () => {
    const { catalogueByKey } = makeCatalogue();

    writeStoredLayout(USER_ID, [makeItem()]);
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearStoredLayout(USER_ID);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(readStoredLayout(USER_ID, catalogueByKey)).toBeNull();
  });
});

// ── The hook itself ──────────────────────────────────────────────────

describe("useWidgetLayout", () => {
  it("returns the default layout when nothing is stored", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const { result } = renderHook(() =>
      useWidgetLayout({ userId: USER_ID, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    expect(result.current.items).toEqual(
      computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    );
  });

  it("returns the stored layout when one is present at mount", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const stored = [makeItem({ widgetKey: "kpi-coaches", x: 0, y: 0 })];

    writeStoredLayout(USER_ID, stored);

    const { result } = renderHook(() =>
      useWidgetLayout({ userId: USER_ID, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    expect(result.current.items).toEqual(stored);
  });

  it("falls back to defaults when the stored value is corrupt", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();

    window.localStorage.setItem(STORAGE_KEY, "{malformed");

    const { result } = renderHook(() =>
      useWidgetLayout({ userId: USER_ID, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    expect(result.current.items).toEqual(
      computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    );
  });

  it("persists layout writes to localStorage under the user key", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const { result } = renderHook(() =>
      useWidgetLayout({ userId: USER_ID, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    const next = [makeItem({ widgetKey: "kpi-athletes", x: 3, y: 0 })];

    act(() => {
      result.current.setLayout(next);
    });

    expect(result.current.items).toEqual(next);
    expect(readStoredLayout(USER_ID, catalogueByKey)).toEqual(next);
  });

  it("resetLayout drops the persisted entry and returns to defaults", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();

    writeStoredLayout(USER_ID, [makeItem({ widgetKey: "kpi-athletes", x: 6 })]);

    const { result } = renderHook(() =>
      useWidgetLayout({ userId: USER_ID, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    expect(result.current.items?.[0]?.x).toBe(6);

    act(() => {
      result.current.resetLayout();
    });

    expect(result.current.items).toEqual(
      computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("renders the anonymous defaults when userId is null", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();
    const { result } = renderHook(() =>
      useWidgetLayout({ userId: null, defaultLayoutWidgetKeys, catalogueByKey }),
    );

    expect(result.current.items).toEqual(
      computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    );

    // Writes with a null user id must not touch storage.
    act(() => {
      result.current.setLayout([makeItem()]);
    });

    expect(result.current.items).toEqual([makeItem()]);
    expect(window.localStorage.length).toBe(0);
  });

  it("promotes a saved layout when userId resolves after mount", () => {
    const { defaultLayoutWidgetKeys, catalogueByKey } = makeCatalogue();

    writeStoredLayout(USER_ID, [makeItem({ widgetKey: "kpi-coaches", x: 9 })]);

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) =>
        useWidgetLayout({ userId: id, defaultLayoutWidgetKeys, catalogueByKey }),
      {
        initialProps: { id: null as string | null },
      },
    );

    // Anonymous mount — defaults.
    expect(result.current.items).toEqual(
      computeDefaultLayoutItems(defaultLayoutWidgetKeys, catalogueByKey),
    );

    rerender({ id: USER_ID });

    // After the id lands, the effect reads the persisted layout in.
    expect(result.current.items?.[0]?.widgetKey).toBe("kpi-coaches");
  });
});
