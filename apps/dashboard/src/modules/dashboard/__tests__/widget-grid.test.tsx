/**
 * @file widget-grid.test.tsx
 * @module modules/dashboard/__tests__/widget-grid.test
 *
 * @description
 * Rendering-contract tests for the overview widget grid. jsdom cannot
 * exercise real drag interactions (no layout engine, no pointer events
 * that trigger `react-grid-layout`'s internal state), so the tests here
 * pin the observable rendering contract instead:
 *
 *   - **Feature flag off** → the CSS-grid fallback markup renders, no
 *     `react-grid-layout` tree is mounted, and no drag handles exist.
 *   - **Feature flag on** → the `react-grid-layout` container renders,
 *     one slot per default widget, and the DnD test id is present.
 *   - **Edit mode on** → each visible widget carries the drag-handle
 *     affordance; the container advertises `data-editing="true"` so the
 *     header / page-level CSS can style it.
 *   - **Edit mode off** → no drag handles, and the container advertises
 *     `data-editing="false"`.
 *
 * Full DnD end-to-end coverage (mouse drop, resize handle drag, keyboard
 * arrow keys) lives in `e2e/dashboard.spec.ts` where a real browser
 * exists.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardLayoutItem } from "@/modules/dashboard/widgets/widget.types";

import { WidgetGrid } from "@/modules/dashboard/components/widget-grid";
import { defaultLayoutWidgetKeys } from "@/modules/dashboard/widgets/widget.catalogue";

/**
 * Every default-layout widget except the onboarding checklist (which the
 * grid deliberately excludes because the page renders it above the grid).
 */
const OVERVIEW_GRID_KEYS = defaultLayoutWidgetKeys.filter((key) => key !== "onboarding-checklist");

/** Baseline layout: place each widget at (index * 3, 0) with a 3-wide slot. */
function makeLayout(): DashboardLayoutItem[] {
  return OVERVIEW_GRID_KEYS.map((key, index) => ({
    widgetKey: key,
    x: (index * 3) % 12,
    y: Math.floor((index * 3) / 12) * 2,
    w: 3,
    h: 1,
  }));
}

// ---------------------------------------------------------------------------
// Feature flag off (CSS-grid fallback)
// ---------------------------------------------------------------------------

describe("WidgetGrid — feature flag off", () => {
  it("renders the CSS-grid fallback markup", () => {
    render(<WidgetGrid overrideDndEnabled={false} view="overview" />);

    expect(screen.getByTestId("widget-grid__css-fallback")).toBeInTheDocument();
    // The DnD grid must NOT render when the flag is off.
    expect(screen.queryByTestId("widget-grid__dnd")).not.toBeInTheDocument();
  });

  it("does not render any drag handles when the flag is off", () => {
    render(<WidgetGrid overrideDndEnabled={false} view="overview" />);

    expect(screen.queryByTestId("widget-grid__drag-handle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("widget-grid__edit-frame")).not.toBeInTheDocument();
  });

  it("renders every default widget key as its own grid slot", () => {
    render(<WidgetGrid overrideDndEnabled={false} view="overview" />);

    const fallback = screen.getByTestId("widget-grid__css-fallback");

    // The fallback container is the only direct parent of the widget
    // slots. Every default widget contributes one child.
    expect(fallback.childElementCount).toBe(OVERVIEW_GRID_KEYS.length);
  });

  it("ignores isEditing when the flag is off (grid stays static)", () => {
    render(<WidgetGrid isEditing overrideDndEnabled={false} view="overview" />);

    // No drag chrome regardless of the `isEditing` prop.
    expect(screen.queryByTestId("widget-grid__drag-handle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("widget-grid__edit-frame")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Feature flag on (DnD grid)
// ---------------------------------------------------------------------------

describe("WidgetGrid — feature flag on", () => {
  it("mounts the DnD grid when the flag is on", () => {
    render(<WidgetGrid overrideDndEnabled layoutItems={makeLayout()} view="overview" />);

    expect(screen.getByTestId("widget-grid__dnd")).toBeInTheDocument();
    // And the fallback must NOT render at the same time.
    expect(screen.queryByTestId("widget-grid__css-fallback")).not.toBeInTheDocument();
  });

  it("renders one slot per widget in the layout", () => {
    render(<WidgetGrid overrideDndEnabled layoutItems={makeLayout()} view="overview" />);

    for (const key of OVERVIEW_GRID_KEYS) {
      expect(screen.getByTestId(`widget-grid__slot-${key}`)).toBeInTheDocument();
    }
  });

  it("marks the container as read-only when isEditing is false", () => {
    render(
      <WidgetGrid
        overrideDndEnabled
        isEditing={false}
        layoutItems={makeLayout()}
        view="overview"
      />,
    );

    const grid = screen.getByTestId("widget-grid__dnd");

    expect(grid).toHaveAttribute("data-editing", "false");
    // No drag chrome in read-only mode.
    expect(screen.queryByTestId("widget-grid__drag-handle")).not.toBeInTheDocument();
  });

  it("marks the container as editing and shows drag handles when isEditing is true", () => {
    render(<WidgetGrid isEditing overrideDndEnabled layoutItems={makeLayout()} view="overview" />);

    const grid = screen.getByTestId("widget-grid__dnd");

    expect(grid).toHaveAttribute("data-editing", "true");

    // Every rendered widget has its own drag-handle affordance.
    const handles = screen.getAllByTestId("widget-grid__drag-handle");

    expect(handles.length).toBe(OVERVIEW_GRID_KEYS.length);

    // The drag handles announce the widget title to screen readers.
    for (const handle of handles) {
      expect(handle).toHaveAttribute("aria-label");
      expect(handle.getAttribute("aria-label")).toMatch(/^Drag /);
    }
  });

  it("synthesises default entries when the layout is missing widgets from the view", () => {
    // Layout has ONE entry; the grid must render every default widget
    // regardless (the rest come from catalogue defaults).
    const partialLayout: DashboardLayoutItem[] = [
      { widgetKey: "kpi-athletes", x: 0, y: 0, w: 3, h: 1 },
    ];

    render(<WidgetGrid overrideDndEnabled layoutItems={partialLayout} view="overview" />);

    // Every default-view widget still gets a slot.
    for (const key of OVERVIEW_GRID_KEYS) {
      expect(screen.getByTestId(`widget-grid__slot-${key}`)).toBeInTheDocument();
    }
  });

  it("does not fire onLayoutChange in read-only mode (initial mount emission)", () => {
    const onLayoutChange = vi.fn();

    render(
      <WidgetGrid
        overrideDndEnabled
        isEditing={false}
        layoutItems={makeLayout()}
        view="overview"
        onLayoutChange={onLayoutChange}
      />,
    );

    // `react-grid-layout` fires `onLayoutChange` once on mount; the
    // component swallows that emission because the user hasn't interacted
    // yet.
    expect(onLayoutChange).not.toHaveBeenCalled();
  });
});
