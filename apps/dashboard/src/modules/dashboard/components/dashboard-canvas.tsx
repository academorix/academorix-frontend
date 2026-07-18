/**
 * @file dashboard-canvas.tsx
 * @module modules/dashboard/components/dashboard-canvas
 *
 * @description
 * The widget grid. Renders in two modes:
 *
 *   * `editable` — used by the main dashboard page. Wraps each
 *     widget in {@link SortableWidget}, exposes drag / resize /
 *     duplicate / remove affordances when the customise panel is
 *     open, and dispatches events back up to the route.
 *   * `readonly` — used by the public embed viewer. Renders flush,
 *     no affordances, no drag.
 *
 * The canvas respects the dashboard's `layoutMode` (`grid` vs
 * `flow`) and each widget's persisted size preset (`config._size`).
 * Widgets that omit the preset fall back to the catalogue's `span`
 * hint so old dashboards keep rendering unchanged.
 *
 * ## Keyboard-first navigation (task F5)
 *
 * When the customise panel is open, the editable canvas installs a
 * document-level keyboard-nav layer via
 * {@link useWidgetKeyboardNav}. Tab moves selection between widgets,
 * arrow keys reorder, Delete removes (with a toast Undo action), and
 * Space/Enter open the widget's action menu. A small floating hint
 * near the bottom of the canvas explains the shortcuts on first use;
 * it's dismissible via a `localStorage` flag so power users only see
 * it once.
 */

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button, toast } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DragEndEvent } from "@dnd-kit/core";
import type {
  Dashboard,
  DashboardDensity,
  WidgetAnnotation,
  WidgetInstance,
} from "@/modules/dashboard/dashboards";
import type { WidgetSize } from "@/modules/dashboard/sortable-widget";
import type { ReactNode } from "react";
import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";

import { Iconify } from "@/icons/iconify";
import {
  hasWidgetFilters,
  WidgetFilterDrawer,
} from "@/modules/dashboard/components/widget-filter-drawer";
import { useWidgetKeyboardNav } from "@/modules/dashboard/dashboards/use-widget-keyboard-nav";
import { SortableWidget, readWidgetSize } from "@/modules/dashboard/sortable-widget";
import { renderWidget } from "@/modules/dashboard/widget-renderer";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/**
 * localStorage key for the keyboard-hint "seen" flag. Namespaced
 * with the app so a schema change lands as a new key rather than
 * silently reusing stale state.
 */
const KEYBOARD_HINT_STORAGE_KEY = "academorix.keyboard-hint-dismissed";

/**
 * Layout mode → root grid class. The gap size is composed dynamically
 * from the dashboard's density preset (see {@link DENSITY_GAP_CLASS}),
 * so this table only owns the shape (columns / stacking) — never
 * spacing. Keeping the two concerns separate lets density flip
 * independently of layout mode without shadowed classes.
 *
 * ## Why NOT `grid-flow-row-dense`
 *
 * The obvious fix for "weird whitespace" gaps between mixed-span
 * widgets (a `full` parent followed by a `third` child leaves the
 * tail of the previous row empty) is `grid-auto-flow: dense`. It
 * back-fills earlier rows with smaller items so `full` + `third`
 * on the same row becomes tight. That change was tried and
 * reverted — it triggers a recharts `ChartDataContextProvider`
 * infinite loop ("Maximum update depth exceeded") inside a dnd-kit
 * `SortableContext`. When the dense algorithm relays out widgets,
 * recharts' embedded ResponsiveContainer + ResizeObserver cycle
 * observes the new box, requests a re-measure, the dense flow
 * re-packs, and so on. React 19's stricter update-depth guard
 * catches it and errors out. Safer paths for the "no whitespace"
 * design: (1) mark specific widgets with explicit `col-span-*` /
 * `row-span-*` classes so the grid layout is deterministic, or
 * (2) migrate to CSS `grid-template-rows: masonry` once browser
 * support crosses the line. For now we stay with strict source
 * order — the visible gaps are the price of avoiding a runtime
 * crash.
 */
const LAYOUT_BASE_CLASS: Record<"grid" | "flow", string> = {
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  flow: "flex flex-col",
};

/**
 * Density preset → Tailwind `gap-*` class applied to the grid root.
 * Cozy matches the pre-density baseline (`gap-4`) so an existing
 * dashboard renders unchanged after the field ships; compact tightens
 * to 8px and comfortable loosens to 24px, both scaling proportionally
 * with the layout mode.
 */
const DENSITY_GAP_CLASS: Record<DashboardDensity, string> = {
  compact: "gap-2",
  cozy: "gap-4",
  comfortable: "gap-6",
};

/** Span → child span class used in readonly mode where we can't hover-toggle. */
const READONLY_SPAN_CLASS: Record<"full" | "half" | "third", string> = {
  full: "col-span-1 md:col-span-2 lg:col-span-3",
  half: "col-span-1 md:col-span-2 lg:col-span-2",
  third: "col-span-1 md:col-span-1 lg:col-span-1",
};

/** Filter out widgets whose renderer isn't registered. */
function usableWidgets(widgets: readonly WidgetInstance[]): WidgetInstance[] {
  return widgets.filter((widget) => renderWidget(widget.widgetType) !== null);
}

export interface DashboardCanvasEditableProps {
  mode: "editable";
  dashboard: Dashboard;
  isEditing: boolean;
  onAddWidget: () => void;
  onRemoveWidget: (widgetInstanceId: string) => void;
  onReorderWidgets: (from: number, to: number) => void;
  onDuplicateWidget?: (widgetInstanceId: string) => void;
  onResizeWidget?: (widgetInstanceId: string, size: WidgetSize) => void;
  /**
   * Bound editor for the dashboard (task F3). Passed to the
   * embedded {@link WidgetFilterDrawer} so the drawer can commit
   * per-instance filter overrides through
   * {@link UseDashboardEditor.updateWidget}. Optional — canvases
   * that don't want the filter override feature (embed viewer,
   * fixture screens) can omit it and the drawer plus overflow-menu
   * item disappear cleanly.
   */
  editor?: UseDashboardEditor;
  /**
   * Tenant-wide annotations snapshot from {@link useDashboards}
   * (task G2). The canvas filters this by widget instance id +
   * dashboard id to compute the per-widget comment count and to
   * pass a scoped view to the popover. When omitted, the comment
   * pill + overflow-menu entry are hidden.
   */
  annotations?: readonly WidgetAnnotation[];
  /** Dashboard id used to bind annotation writes to this dashboard. */
  dashboardId?: string;
  /** Add a new annotation to a widget on this dashboard. */
  onAddAnnotation?: (widgetInstanceId: string, body: string) => Promise<WidgetAnnotation>;
  /** Update an existing annotation's body. */
  onUpdateAnnotation?: (annotationId: string, body: string) => Promise<WidgetAnnotation>;
  /** Remove an annotation. */
  onRemoveAnnotation?: (annotationId: string) => Promise<void>;
}

export interface DashboardCanvasReadonlyProps {
  mode: "readonly";
  dashboard: Pick<Dashboard, "layoutMode" | "widgets" | "density">;
  /**
   * Annotations to surface on the read-only canvas (embed viewer).
   * Optional — most embed surfaces omit annotations entirely for
   * privacy. When provided, comment pills render but the "Add a
   * comment" surface is hidden by the popover's `isReadOnly` flag.
   */
  annotations?: readonly WidgetAnnotation[];
}

export type DashboardCanvasProps = DashboardCanvasEditableProps | DashboardCanvasReadonlyProps;

export function DashboardCanvas(props: DashboardCanvasProps): ReactNode {
  const { dashboard } = props;
  const widgets = useMemo(() => usableWidgets(dashboard.widgets), [dashboard.widgets]);

  if (props.mode === "readonly") {
    // Read the density with a cozy fallback — matches every other
    // consumer of `dashboard.density` and keeps embed pages from
    // rendering a "loose" layout when the field is missing on the
    // public payload.
    const density = dashboard.density ?? "cozy";
    const rootClass = `${LAYOUT_BASE_CLASS[dashboard.layoutMode]} ${DENSITY_GAP_CLASS[density]}`;

    return (
      <div className={rootClass} data-density={density}>
        {widgets.map((widget) => {
          const entry = findWidget(widget.widgetType);
          const span = entry?.span ?? "third";
          const content = renderWidget(widget.widgetType);

          if (!content) {
            return null;
          }

          // WHY: The readonly canvas renders widgets flush — no
          // drag chrome, no annotation surfaces. Annotations are
          // owner-private on the storage layer (see the docblock on
          // {@link WidgetAnnotation}) and the public embed viewer
          // never surfaces them regardless of the dashboard's
          // visibility. Future in-app read-only surfaces (a signed-in
          // viewer looking at a shared dashboard they can't edit)
          // can bolt a lighter annotation wrapper on top of this
          // branch without invalidating the embed contract.
          return (
            <div
              key={widget.id}
              className={dashboard.layoutMode === "grid" ? READONLY_SPAN_CLASS[span] : ""}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  }

  return <EditableCanvas {...props} widgets={widgets} />;
}

/**
 * Dispatch a synthetic `Ctrl+Z` keydown so the page-scoped undo
 * shortcut registered in `dashboard.tsx` fires. Used by the "Undo"
 * action on the widget-remove toast so we don't have to plumb an
 * `onUndo` callback all the way down from the route.
 *
 * The synthetic event carries both `ctrlKey` and `metaKey` so it
 * satisfies the page's cross-platform modifier check on macOS +
 * Windows/Linux without branching.
 */
function dispatchUndo(): void {
  if (typeof document === "undefined") return;

  const event = new KeyboardEvent("keydown", {
    key: "z",
    code: "KeyZ",
    ctrlKey: true,
    metaKey: true,
    bubbles: true,
  });

  document.dispatchEvent(event);
  window.dispatchEvent(event);
}

/**
 * Read the "keyboard hint dismissed" flag from `localStorage`. Kept
 * safe against SSR + storage-access exceptions (e.g. Safari private
 * mode) so the canvas mounts under any browser policy.
 */
function readHintDismissed(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(KEYBOARD_HINT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Persist the "keyboard hint dismissed" flag. Best-effort — never
 * throws so the UI still updates even when storage is unavailable.
 */
function writeHintDismissed(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(KEYBOARD_HINT_STORAGE_KEY, "1");
  } catch {
    // Storage unavailable — the hint reappears next mount, but the
    // toast Undo affordance still works fine.
  }
}

function EditableCanvas({
  dashboard,
  isEditing,
  onAddWidget,
  onRemoveWidget,
  onReorderWidgets,
  onDuplicateWidget,
  onResizeWidget,
  editor,
  annotations,
  dashboardId,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  widgets,
}: DashboardCanvasEditableProps & { widgets: WidgetInstance[] }): ReactNode {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Stable list of widget ids in draw order.
   *
   * WHY the memo: `SortableContext` compares `items` by reference
   * to decide whether the sortable state needs rebuilding, and a
   * fresh array literal every render forces it to recompute
   * measurements. When the canvas contains chart widgets, that
   * chain terminates in recharts' `ResponsiveContainer` firing
   * `ResizeObserver` on every pass — enough to blow past React
   * 19's max-update-depth guard and surface as "Maximum update
   * depth exceeded" against `ChartDataContextProvider`.
   */
  const idsInOrder = useMemo(() => widgets.map((widget) => widget.id), [widgets]);

  // WHY: Track the widget whose filter drawer is currently open.
  // Kept as a string id (rather than the widget object) so a
  // re-render after `editor.updateWidget` still resolves to the
  // freshest widget instance via `widgets.find`.
  const [filterWidgetId, setFilterWidgetId] = useState<string | null>(null);
  const filterTarget = useMemo(
    () =>
      filterWidgetId ? (widgets.find((widget) => widget.id === filterWidgetId) ?? null) : null,
    [filterWidgetId, widgets],
  );

  // Group the passed-in annotation snapshot by widget id so the
  // per-widget count + scoped array are O(1) lookups during render.
  // Falls back to an empty array so consumers can always spread it.
  const annotationsByWidget = useMemo(() => {
    const byWidget = new Map<string, WidgetAnnotation[]>();

    if (!annotations || !dashboardId) return byWidget;

    for (const annotation of annotations) {
      // Filter to the current dashboard so a tenant-wide snapshot
      // doesn't leak comments across dashboards.
      if (annotation.dashboardId !== dashboardId) continue;

      const bucket = byWidget.get(annotation.widgetInstanceId) ?? [];

      bucket.push(annotation);
      byWidget.set(annotation.widgetInstanceId, bucket);
    }

    return byWidget;
  }, [annotations, dashboardId]);

  // Bind the (widgetInstanceId, body) → annotation mutator to the
  // canvas's callback so each SortableWidget can call it with just
  // the body. Same for update / remove which don't need widget id.
  const boundAddAnnotation = useCallback(
    (widgetInstanceId: string) => async (body: string) => {
      if (!onAddAnnotation) {
        throw new Error("Canvas is not wired for annotations.");
      }

      return onAddAnnotation(widgetInstanceId, body);
    },
    [onAddAnnotation],
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const from = idsInOrder.indexOf(String(active.id));
    const to = idsInOrder.indexOf(String(over.id));

    if (from < 0 || to < 0) return;

    onReorderWidgets(from, to);
  };

  const copyWidgetLink = (widgetInstanceId: string): void => {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    const url = `${window.location.origin}${window.location.pathname}#widget=${widgetInstanceId}`;

    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Widget link copied", { description: url }))
      .catch(() => toast.danger("Couldn't copy the link"));
  };

  /**
   * Wrap the raw remove handler so keyboard-driven deletions come
   * with a toast-native Undo action. The toast fires from the
   * keyboard nav's Delete branch — the SortableWidget menu still
   * uses the raw `onRemoveWidget` since it has its own confirm UI.
   */
  const handleKeyboardRemove = useCallback(
    (widgetInstanceId: string): void => {
      const removedWidget = widgets.find((widget) => widget.id === widgetInstanceId);
      const label =
        (removedWidget && findWidget(removedWidget.widgetType)?.title) ??
        removedWidget?.title ??
        "Widget";

      onRemoveWidget(widgetInstanceId);

      toast(`${label} removed`, {
        description: "Press Undo to bring it back.",
        actionProps: {
          children: "Undo",
          size: "sm",
          variant: "secondary",
          // The page owns the undo stack — dispatching Ctrl+Z lets
          // that same handler roll the state back without teaching
          // the canvas about the editor's private API.
          onPress: dispatchUndo,
        },
      });
    },
    [onRemoveWidget, widgets],
  );

  const nav = useWidgetKeyboardNav({
    widgets,
    isEnabled: isEditing,
    onReorder: onReorderWidgets,
    onRemove: handleKeyboardRemove,
    onDuplicate: onDuplicateWidget,
  });

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={idsInOrder} strategy={rectSortingStrategy}>
        {/* WHY: Compose the layout class from `LAYOUT_BASE_CLASS`
            (shape) + `DENSITY_GAP_CLASS` (spacing). Doing it here
            (rather than in a memoised const) keeps the class list
            straightforward to read + lets density flip without a
            re-mount. The `data-density` attribute lets future
            widget-level styling read the current density without
            re-wiring the prop tree. */}
        {(() => {
          const density: DashboardDensity = dashboard.density ?? "cozy";
          const rootClass = `${LAYOUT_BASE_CLASS[dashboard.layoutMode]} ${DENSITY_GAP_CLASS[density]} relative`;

          return (
            <div className={rootClass} data-density={density}>
              {widgets.map((widget) => {
                const size = readWidgetSize(widget.config as Record<string, unknown> | undefined);
                const keyboardProps = nav.getWidgetProps(widget.id);
                const widgetAnnotations = annotationsByWidget.get(widget.id) ?? [];
                // Only enable the filter override affordance when
                // the parent handed us an editor. That keeps
                // downstream surfaces without an editor (fixture
                // pages, tests) from rendering an inert menu item.
                const canFilterWidget = Boolean(editor);
                // Only enable the annotations affordance when the
                // parent plumbed the write callbacks + a dashboard
                // id. Missing either would produce a popover that
                // can view but not mutate — surfacing a broken UI.
                const canAnnotate = Boolean(
                  dashboardId && onAddAnnotation && onUpdateAnnotation && onRemoveAnnotation,
                );

                return (
                  <SortableWidget
                    key={widget.id}
                    annotationsForWidget={canAnnotate ? widgetAnnotations : undefined}
                    commentCount={canAnnotate ? widgetAnnotations.length : 0}
                    hasFilters={hasWidgetFilters(widget.filters)}
                    isAnnotationsReadOnly={false}
                    isEditing={isEditing}
                    isSelected={keyboardProps.isSelected}
                    onAddAnnotation={canAnnotate ? boundAddAnnotation(widget.id) : undefined}
                    onCopyLink={copyWidgetLink}
                    onDuplicate={onDuplicateWidget}
                    onOpenFilters={canFilterWidget ? setFilterWidgetId : undefined}
                    onRemove={onRemoveWidget}
                    onRemoveAnnotation={canAnnotate ? onRemoveAnnotation : undefined}
                    onResize={onResizeWidget}
                    onUpdateAnnotation={canAnnotate ? onUpdateAnnotation : undefined}
                    size={size}
                    widgetInstanceId={widget.id}
                    widgetKey={widget.widgetType}
                  />
                );
              })}
              {isEditing ? (
                <button
                  aria-label="Add widget"
                  className={[
                    "border-border hover:border-accent hover:bg-surface-secondary/60",
                    "flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-sm transition-colors",
                    dashboard.layoutMode === "grid" ? READONLY_SPAN_CLASS.third : "",
                  ].join(" ")}
                  onClick={onAddWidget}
                  type="button"
                >
                  <Iconify className="size-6 text-muted" icon="plus" />
                  <span className="text-muted">Add widget</span>
                </button>
              ) : null}
            </div>
          );
        })()}
      </SortableContext>
      {isEditing ? <KeyboardHint /> : null}
      {/* WHY: One shared drawer instance handles the filter override
          for whichever widget is currently active — mounting one
          per widget would multiply DOM cost and confuse the focus
          trap when the user switches widgets. */}
      {editor ? (
        <WidgetFilterDrawer
          editor={editor}
          isOpen={filterTarget !== null}
          onOpenChange={(open) => {
            if (!open) setFilterWidgetId(null);
          }}
          widget={filterTarget}
        />
      ) : null}
    </DndContext>
  );
}

/**
 * A small floating banner near the bottom of the canvas that lists
 * the keyboard shortcuts for widget navigation. Dismissible via a
 * localStorage flag so power users only see it once.
 *
 * Kept as its own component so the state + persistence are colocated
 * — the canvas only decides *whether* to render it.
 */
function KeyboardHint(): ReactNode {
  const [isDismissed, setDismissed] = useState<boolean>(readHintDismissed);

  // Rehydrate on mount — SSR-safe because `readHintDismissed`
  // guards against `window` being undefined at initial-state read.
  useEffect(() => {
    setDismissed(readHintDismissed());
  }, []);

  const handleDismiss = useCallback(() => {
    writeHintDismissed();
    setDismissed(true);
  }, []);

  if (isDismissed) return null;

  return (
    <div
      aria-live="polite"
      className="bg-surface-primary/95 pointer-events-auto sticky bottom-4 mt-4 flex items-center gap-3 rounded-xl border border-border px-4 py-2 text-xs shadow-lg backdrop-blur"
      role="note"
    >
      <Iconify className="size-4 text-accent" icon="sparkles" />
      <p className="text-foreground">
        <strong>Tab</strong> / <strong>Shift+Tab</strong> to navigate, <strong>arrows</strong> to
        move, <strong>Space</strong> for actions, <strong>Del</strong> to remove.
      </p>
      <div className="flex-1" />
      <Button
        aria-label="Dismiss keyboard shortcuts hint"
        isIconOnly
        onPress={handleDismiss}
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-4" icon="xmark" />
      </Button>
    </div>
  );
}
