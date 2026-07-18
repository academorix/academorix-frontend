/**
 * @file widget-grid.tsx
 * @module modules/dashboard/components/widget-grid
 *
 * @description
 * The overview widget grid — with two rendering paths behind
 * {@link features.overviewDnd}:
 *
 *   1. **DnD grid on** (`features.overviewDnd === true`): renders each widget
 *      inside `react-grid-layout`'s `Responsive` + `WidthProvider` so users
 *      can drag / resize widgets when the "Edit layout" toggle is engaged.
 *      Layout state is persisted per-user via {@link useWidgetLayout}. The
 *      shape of each widget is driven by the catalogue's `defaultLayout`
 *      block plus the user's saved overrides.
 *   2. **DnD grid off** (`features.overviewDnd === false`): renders the same
 *      set of widgets in a plain CSS grid, matching Phase 1c's static
 *      layout. Used as an ops kill-switch for the DnD wiring.
 *
 * Both paths render each widget inside its own `Suspense` boundary so one
 * slow probe cannot block sibling widgets, and both fall back to an
 * `<UnknownWidget>` placeholder when a saved layout entry references a
 * widget the registry does not know about.
 *
 * ## Edit-mode UX
 *
 * The "Edit layout" toggle in the page header (see `dashboard-page.tsx`)
 * flips `isEditing` on this component. When on:
 *
 *   - Every widget gets a bordered outline + a drag handle in the top-left.
 *   - The `Responsive` grid enables `isDraggable` + `isResizable`.
 *   - The "Reset layout" button in the header becomes visible.
 *
 * When off the grid is locked (drag / resize disabled via `static: true`
 * on every item) but positions are preserved so the read-only view
 * matches the layout the user last saved.
 *
 * ## Accessibility
 *
 * `react-grid-layout` handles keyboard drag via the underlying
 * `react-draggable` — arrow keys move a focused item once the drag handle
 * has focus. `isBounded` keeps the drag inside the container so a
 * keyboard user cannot lose an item off-screen, and `draggableCancel`
 * excludes interactive elements inside widgets (buttons, links) from
 * triggering the drag.
 */

import "react-grid-layout/css/styles.css";

import { Card, Skeleton } from "@stackra/ui/react";
import { Suspense, useCallback, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";

import type { DashboardLayoutItem } from "@/modules/dashboard/widgets/widget.types";
import type { ReactNode } from "react";
import type { Layout } from "react-grid-layout";

import { features } from "@/config/features.config";
import {
  defaultLayoutWidgetKeys,
  widgetCatalogueByKey,
} from "@/modules/dashboard/widgets/widget.catalogue";
import { widgetRenderers } from "@/modules/dashboard/widgets/widget.registry";

/**
 * `WidthProvider` measures its parent's width on every resize and passes it
 * down to `Responsive`. Wrapping it once at module scope means React does
 * not recreate the HOC on every render — the plugin's own recipe.
 */
const ResponsiveGridLayout = WidthProvider(Responsive);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Analytics-view widget selection. Phase 5 will drive this from saved
 * `analytics` presets; for Phase 1 it is a hand-picked subset of the
 * catalogue that biases toward money and chart widgets.
 */
const ANALYTICS_WIDGET_KEYS: readonly string[] = [
  "kpi-revenue-mtd",
  "kpi-outstanding-invoices",
  "kpi-active-memberships",
  "kpi-open-leads",
  "list-recent-registrations",
  "list-upcoming-events",
];

/**
 * Column counts per breakpoint. Kept in sync with the catalogue's
 * `defaultLayout.w` values (which target 12 cols at `lg`) so a widget's
 * intended width lands at every breakpoint.
 */
const RESPONSIVE_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as const;

/**
 * Breakpoint px thresholds. These match Tailwind's default `sm` / `md` /
 * `lg` prefixes closely enough that widgets that look right in the picker
 * look right on the grid.
 */
const RESPONSIVE_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;

/**
 * Row height in pixels. The plan defines widget heights in 60px row units;
 * this is that unit. Keep in sync with the height comments in
 * `widget.catalogue.ts`.
 */
const ROW_HEIGHT_PX = 60;

/**
 * CSS class applied to the drag handle. Every widget in edit mode gets an
 * element with this class; `react-grid-layout` picks it up via
 * `draggableHandle`. In read-only mode the handle is not rendered, so the
 * grid ignores drag gestures entirely.
 */
const DRAG_HANDLE_CLASS = "widget-grid__drag-handle";

/**
 * CSS class applied to any element inside a widget that must NOT trigger a
 * drag (buttons, links, form controls). `react-grid-layout` treats a
 * pointerdown on any descendant of this class as a "cancel drag" gesture.
 * Widgets that render clickable content wrap those interactive elements
 * with this class so keyboard / mouse users can operate the widget
 * without accidentally repositioning it.
 */
const DRAG_CANCEL_CLASS = "widget-grid__no-drag";

/** Grid cell size classes keyed by the widget's default width. */
const WIDTH_CLASSES: Record<1 | 2 | 3, string> = {
  1: "sm:col-span-1",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
};

/** Grid cell size classes keyed by the widget's default height. */
const HEIGHT_CLASSES: Record<1 | 2, string> = {
  1: "sm:row-span-1",
  2: "sm:row-span-2",
};

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

/** Skeleton placeholder rendered while a lazy renderer loads. */
function WidgetFallback(): ReactNode {
  return (
    <Card className="h-full">
      <Card.Header>
        <Skeleton className="h-4 w-24" />
      </Card.Header>
      <Card.Content>
        <Skeleton className="h-8 w-32" />
      </Card.Content>
    </Card>
  );
}

/** Placeholder rendered for a widget key we do not have a renderer for. */
function UnknownWidget({ widgetKey }: { widgetKey: string }): ReactNode {
  return (
    <Card className="h-full border border-dashed border-border">
      <Card.Header>
        <Card.Description>Coming soon</Card.Description>
        <Card.Title>{widgetKey}</Card.Title>
      </Card.Header>
    </Card>
  );
}

/**
 * Wraps a widget renderer in its own Suspense boundary. Extracted from the
 * two render paths (DnD grid + CSS grid fallback) so both share the same
 * "unknown widget" and skeleton behaviour.
 */
function WidgetSlot({ widgetKey }: { widgetKey: string }): ReactNode {
  const Renderer = widgetRenderers.get(widgetKey);

  return (
    <Suspense fallback={<WidgetFallback />}>
      {Renderer ? (
        <Renderer config={{}} onConfigChange={() => undefined} />
      ) : (
        <UnknownWidget widgetKey={widgetKey} />
      )}
    </Suspense>
  );
}

/**
 * Wraps a widget in the edit-mode chrome (bordered outline + drag handle).
 * The handle is a small pill in the top-left corner labelled with the
 * widget's title so screen readers announce "Drag {title} widget".
 */
function EditModeFrame({ children, title }: { children: ReactNode; title: string }): ReactNode {
  return (
    <div
      className="relative h-full rounded-md ring-2 ring-accent/50 ring-offset-2 ring-offset-background"
      data-testid="widget-grid__edit-frame"
    >
      {/*
       * Drag handle — the `DRAG_HANDLE_CLASS` matches `draggableHandle`
       * on the Responsive grid so mousedown / keydown here (and only
       * here) starts a drag. `role="button"` + `aria-label` gives
       * screen readers something to speak. Focusable via `tabIndex={0}`
       * so keyboard users can Tab-in and then arrow to move.
       */}
      <div
        aria-label={`Drag ${title}`}
        className={`absolute top-2 left-2 z-10 flex cursor-grab items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs text-accent shadow-sm ${DRAG_HANDLE_CLASS}`}
        data-testid="widget-grid__drag-handle"
        role="button"
        tabIndex={0}
      >
        <span aria-hidden="true">⋮⋮</span>
        <span className="sr-only">{`Drag ${title}`}</span>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout translation helpers
// ---------------------------------------------------------------------------

/**
 * Converts our internal {@link DashboardLayoutItem} shape into the
 * `Layout[]` shape `react-grid-layout` expects. Adds the widget's
 * catalogue-defined min/max bounds so the resize clamp stays honest and
 * `static: !isEditing` so the grid is locked when the user isn't editing.
 */
function toGridLayout(items: DashboardLayoutItem[], isEditing: boolean): Layout[] {
  const result: Layout[] = [];

  for (const item of items) {
    const definition = widgetCatalogueByKey.get(item.widgetKey);

    if (!definition) {
      // Unknown widget keys are already dropped by the persistence
      // layer, but guard here as well — a caller could pass a
      // hand-built list.
      continue;
    }

    const { defaultLayout } = definition;

    result.push({
      i: item.widgetKey,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: defaultLayout.minW,
      minH: defaultLayout.minH,
      maxW: defaultLayout.maxW,
      maxH: defaultLayout.maxH,
      // `static` overrides `isDraggable`/`isResizable` — locking every
      // item outside edit mode is the least-error-prone way to make
      // sure a stray click doesn't reflow the grid.
      static: item.isStatic ?? !isEditing,
    });
  }

  return result;
}

/**
 * Converts the grid-layout callback shape back into our persistence
 * shape. Preserves order because the grid can (and does) reorder items
 * when the user drops one on top of another.
 */
function fromGridLayout(layout: Layout[]): DashboardLayoutItem[] {
  return layout.map((entry) => ({
    widgetKey: entry.i,
    x: entry.x,
    y: entry.y,
    w: entry.w,
    h: entry.h,
    // `static: true` in the grid means the item is pinned — mirror that
    // back into the persistence shape so a reload keeps the pin.
    isStatic: entry.static === true ? true : undefined,
  }));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for {@link WidgetGrid}. */
export interface WidgetGridProps {
  /**
   * Which view is active. `overview` uses the default layout; `analytics`
   * biases toward chart widgets. Both share the same widget catalogue.
   */
  view: "overview" | "analytics";
  /**
   * When `true` the DnD grid enables `isDraggable` + `isResizable` and
   * renders drag-handle affordances on each widget. When `false` the grid
   * is locked. Kept as a prop (not internal state) so the header's
   * "Edit layout" toggle lives on the page while the wiring stays here.
   */
  isEditing?: boolean;
  /**
   * The current per-user layout items. Passed from the page which owns
   * the {@link useWidgetLayout} hook so the reset button in the header
   * shares state with the grid.
   */
  layoutItems?: DashboardLayoutItem[];
  /**
   * Called with the new layout after every drag / resize stop when DnD is
   * enabled. The page persists the value via `useWidgetLayout.setLayout`.
   * Optional so the CSS-grid fallback path can omit it entirely.
   */
  onLayoutChange?: (items: DashboardLayoutItem[]) => void;
  /**
   * Feature-flag override used by tests to force either code path. When
   * omitted the component reads `features.overviewDnd` at render time.
   */
  overrideDndEnabled?: boolean;
}

// ---------------------------------------------------------------------------
// The component
// ---------------------------------------------------------------------------

/**
 * The overview widget grid. Reads the feature flag once per render and
 * dispatches to either the DnD grid or the CSS grid fallback. Both paths
 * render the same set of widgets so switching the flag is safe at any
 * point.
 */
export function WidgetGrid({
  view,
  isEditing = false,
  layoutItems,
  onLayoutChange,
  overrideDndEnabled,
}: WidgetGridProps): ReactNode {
  // `useMemo` pins the widget key list so the grid doesn't recompute the
  // filter on every render (which would fire `onLayoutChange` in a loop).
  const widgetKeys = useMemo(() => {
    const source = view === "analytics" ? ANALYTICS_WIDGET_KEYS : defaultLayoutWidgetKeys;

    return source.filter((key) => {
      const definition = widgetCatalogueByKey.get(key);

      // Onboarding checklist is rendered above the grid in overview view.
      return definition && definition.key !== "onboarding-checklist";
    });
  }, [view]);

  // `overrideDndEnabled` short-circuits the feature flag in tests. In
  // production the flag comes from Vite's env at build time.
  const dndEnabled = overrideDndEnabled ?? features.overviewDnd;

  // Filter the layout entries to whatever the current view lists.
  // Widgets not in the current view are omitted; positions of the
  // remaining widgets are preserved as-is. The `layoutItems ?? []`
  // fallback stays inside the memo so the useMemo dependency array is
  // stable across renders that pass no items in.
  const activeItems = useMemo(
    () => (layoutItems ?? []).filter((item) => widgetKeys.includes(item.widgetKey)),
    [layoutItems, widgetKeys],
  );

  // If the current view doesn't have entries for every widget key (e.g.
  // the analytics view before its first save), synthesise defaults for
  // the missing ones from the catalogue.
  const paddedItems = useMemo(() => {
    const known = new Set(activeItems.map((item) => item.widgetKey));
    const missing = widgetKeys.filter((key) => !known.has(key));

    let cursorX = 0;
    let cursorY =
      activeItems.length === 0 ? 0 : Math.max(...activeItems.map((item) => item.y + item.h));
    let rowHeight = 0;

    const synthesised: DashboardLayoutItem[] = [];

    for (const key of missing) {
      const definition = widgetCatalogueByKey.get(key);

      if (!definition) {
        continue;
      }

      const { w, h } = definition.defaultLayout;

      if (cursorX + w > RESPONSIVE_COLS.lg) {
        cursorX = 0;
        cursorY += rowHeight;
        rowHeight = 0;
      }

      synthesised.push({ widgetKey: key, x: cursorX, y: cursorY, w, h });
      cursorX += w;
      rowHeight = Math.max(rowHeight, h);
    }

    return [...activeItems, ...synthesised];
  }, [activeItems, widgetKeys]);

  const gridLayoutLg = useMemo(
    () => toGridLayout(paddedItems, isEditing),
    [paddedItems, isEditing],
  );

  const handleLayoutChange = useCallback(
    (nextLg: Layout[]) => {
      // Ignore layout emissions in read-only mode. `react-grid-layout`
      // still fires them on initial mount, which we do not want to
      // persist — the user hasn't changed anything.
      if (!isEditing) {
        return;
      }

      onLayoutChange?.(fromGridLayout(nextLg));
    },
    [isEditing, onLayoutChange],
  );

  // -----------------------------------------------------------------------
  // CSS-grid fallback (DnD disabled)
  // -----------------------------------------------------------------------
  if (!dndEnabled) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="widget-grid__css-fallback"
      >
        {widgetKeys.map((key) => {
          const definition = widgetCatalogueByKey.get(key);
          const widthClass = definition ? WIDTH_CLASSES[definition.defaultWidth] : "sm:col-span-1";
          const heightClass = definition
            ? HEIGHT_CLASSES[definition.defaultHeight]
            : "sm:row-span-1";

          return (
            <div key={key} className={[widthClass, heightClass].join(" ")}>
              <WidgetSlot widgetKey={key} />
            </div>
          );
        })}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // DnD grid (DnD enabled)
  // -----------------------------------------------------------------------
  //
  // `react-grid-layout` positions children by matching each child's `key`
  // to a layout entry's `i`. We render one wrapper per widget key with
  // that contract — the wrapper takes the drag-handle affordance in edit
  // mode; the widget content sits inside a Suspense boundary as usual.

  return (
    <div data-editing={isEditing} data-testid="widget-grid__dnd">
      <ResponsiveGridLayout
        isBounded
        breakpoints={RESPONSIVE_BREAKPOINTS}
        cols={RESPONSIVE_COLS}
        compactType="vertical"
        containerPadding={[0, 0]}
        draggableCancel={`.${DRAG_CANCEL_CLASS}`}
        draggableHandle={`.${DRAG_HANDLE_CLASS}`}
        isDraggable={isEditing}
        isResizable={isEditing}
        layouts={{ lg: gridLayoutLg }}
        margin={[16, 16]}
        rowHeight={ROW_HEIGHT_PX}
        onLayoutChange={handleLayoutChange}
      >
        {paddedItems.map((item) => {
          const definition = widgetCatalogueByKey.get(item.widgetKey);
          const title = definition?.title ?? item.widgetKey;

          return (
            <div
              key={item.widgetKey}
              className={DRAG_CANCEL_CLASS}
              data-testid={`widget-grid__slot-${item.widgetKey}`}
            >
              {isEditing ? (
                <EditModeFrame title={title}>
                  <WidgetSlot widgetKey={item.widgetKey} />
                </EditModeFrame>
              ) : (
                <WidgetSlot widgetKey={item.widgetKey} />
              )}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
