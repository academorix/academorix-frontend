/**
 * @file widget-filter-drawer.tsx
 * @module modules/dashboard/components/widget-filter-drawer
 *
 * @description
 * A HeroUI `Drawer` that edits a *single widget instance's* filter
 * override (task F3). Opened from the widget's overflow menu on the
 * editable canvas. Fields mirror the dashboard-wide Filters tab
 * (`dateFrom`, `dateTo`, `scope.branchId`) so the operator can
 * pin one tile to a different slice without opening the customise
 * panel.
 *
 * ## Semantics
 *
 *   * Dashboard-level filters (see the customise panel's Filters
 *     tab) act as **defaults**. A widget without a per-instance
 *     override inherits those defaults verbatim.
 *   * When the widget declares a `filters` object of its own, it
 *     wins for that widget — no field merge. That mirrors how the
 *     backend reads the two levels in a single `where` clause and
 *     keeps the mental model simple: "instance filters replace the
 *     dashboard filters for this tile".
 *   * The **Reset** button clears the override (`updateWidget(id,
 *     {filters: undefined})`) so the widget starts reading from the
 *     dashboard-level defaults again.
 *
 * ## Design notes
 *
 *   * The drawer opens from the right edge (matches the customise
 *     panel + widget-catalogue drawer) so it feels like the same
 *     tool chain.
 *   * Every field is optional — a save with only `dateFrom` set is
 *     valid and stores exactly one field on the widget instance.
 *   * The dashboard-level defaults are shown as small captions
 *     under each field so the operator can see what they'd inherit
 *     without leaving the drawer.
 */

import { Button, Chip, Drawer, Input, Label, TextField, toast } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import type {
  DashboardFilters,
  UseDashboardEditor,
  WidgetInstance,
} from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/**
 * True when the filter object carries at least one meaningful value.
 * Kept as its own predicate so both the "Filtered" chip on the
 * sortable widget and the drawer's Reset affordance read from a
 * single definition of "non-empty".
 */
export function hasWidgetFilters(filters: DashboardFilters | undefined): boolean {
  if (!filters) return false;

  if (filters.dateFrom || filters.dateTo) return true;

  const scope = filters.scope;

  if (!scope) return false;

  return Boolean(scope.branchId || scope.organizationId || scope.seasonId || scope.cohortId);
}

/**
 * Local draft shape — we edit the field triple in local state and
 * commit to the editor on Save. Storing them individually (rather
 * than as a single `DashboardFilters`) keeps the input controlled
 * without extra memo shuffling around `scope`.
 */
interface DraftState {
  dateFrom: string;
  dateTo: string;
  branchId: string;
}

/** Empty draft — used when the widget has no override yet. */
const EMPTY_DRAFT: DraftState = { dateFrom: "", dateTo: "", branchId: "" };

/**
 * Project a widget's persisted `filters` (if any) into the local
 * draft shape so every input is controlled from mount.
 */
function toDraft(source: DashboardFilters | undefined): DraftState {
  if (!source) return EMPTY_DRAFT;

  return {
    dateFrom: source.dateFrom ?? "",
    dateTo: source.dateTo ?? "",
    branchId: source.scope?.branchId ?? "",
  };
}

/**
 * Project the draft back to the persisted filter shape. Empty
 * strings turn into `undefined` so a "cleared" field doesn't leave
 * a truthy empty-string on the wire. When every field is empty the
 * projection returns `undefined` so the widget instance re-inherits
 * the dashboard-level defaults.
 */
function toFilters(draft: DraftState): DashboardFilters | undefined {
  const dateFrom = draft.dateFrom.trim() || undefined;
  const dateTo = draft.dateTo.trim() || undefined;
  const branchId = draft.branchId.trim() || undefined;

  if (!dateFrom && !dateTo && !branchId) return undefined;

  const projected: DashboardFilters = {};

  if (dateFrom) projected.dateFrom = dateFrom;
  if (dateTo) projected.dateTo = dateTo;
  if (branchId) projected.scope = { branchId };

  return projected;
}

export interface WidgetFilterDrawerProps {
  /** Editor bound to the currently-open dashboard. */
  editor: UseDashboardEditor;
  /**
   * Widget instance being edited, or `null` to keep the drawer
   * closed. Splitting the two lets the caller pass a stable prop
   * regardless of which widget is targeted.
   */
  widget: WidgetInstance | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Editable drawer for a single widget's filter override. Emits
 * changes through {@link UseDashboardEditor.updateWidget} so the
 * edit lands in the draft state alongside every other widget edit —
 * saved together on the next Save action from the customise panel.
 */
export function WidgetFilterDrawer({
  editor,
  widget,
  isOpen,
  onOpenChange,
}: WidgetFilterDrawerProps): ReactNode {
  // WHY: The drawer is controlled by the parent. Local state holds
  // the *draft* so the operator can type freely without every
  // keystroke re-rendering the entire canvas.
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  // Reset the draft whenever the target widget changes (a different
  // overflow menu opened the drawer) or the drawer re-opens after a
  // close. Without this the drawer would show stale values from a
  // prior widget on second open.
  useEffect(() => {
    setDraft(widget ? toDraft(widget.filters) : EMPTY_DRAFT);
  }, [widget, isOpen]);

  const catalogue = widget ? findWidget(widget.widgetType) : undefined;
  const dashboardDefaults = editor.draft.filters;

  // Predicate used by the Reset button — hide it when the widget
  // has no override, so the drawer never renders a no-op action.
  const hasOverride = useMemo(() => hasWidgetFilters(widget?.filters), [widget?.filters]);

  const handleSave = (): void => {
    if (!widget) return;

    const nextFilters = toFilters(draft);

    // WHY: `updateWidget` merges the patch into the widget instance
    // in the editor's draft state; saving the dashboard flushes the
    // whole draft back to the storage adapter. That keeps this
    // drawer transactional with the rest of the editor's dirty
    // tracking — no partial writes to persist here.
    editor.updateWidget(widget.id, { filters: nextFilters });
    toast(nextFilters ? "Filter override saved" : "Filter override cleared", {
      description: catalogue?.title ?? widget.title ?? widget.widgetType,
    });
    onOpenChange(false);
  };

  const handleReset = (): void => {
    if (!widget) return;

    // Clearing the override drops the field entirely — the widget
    // re-inherits the dashboard-level defaults on next render.
    editor.updateWidget(widget.id, { filters: undefined });
    setDraft(EMPTY_DRAFT);
    toast("Filter override cleared", {
      description: `${catalogue?.title ?? widget.widgetType} now uses the dashboard filters.`,
    });
  };

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog>
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <div className="flex items-center gap-2">
              <Iconify className="size-4 text-accent" icon="funnel" />
              <Drawer.Heading>Filter widget</Drawer.Heading>
              {hasOverride ? (
                <Chip className="ms-auto" size="sm" variant="soft">
                  <Chip.Label>Override active</Chip.Label>
                </Chip>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              These filters replace the dashboard-wide filters for{" "}
              <strong className="text-foreground">
                {catalogue?.title ?? widget?.title ?? widget?.widgetType ?? "this widget"}
              </strong>
              . Leave a field blank to inherit the dashboard default.
            </p>
          </Drawer.Header>
          <Drawer.Body>
            {/*
             * WHY the pb-3 wrap: same rationale as
             * `widget-catalogue-drawer` — the compound's `p-6` sits on
             * Drawer.Dialog, but the scroll Body's own children still
             * flush with the footer border. A small bottom pad lifts
             * the last field off the border-top and gives the drawer a
             * proper "the form has ended" affordance.
             */}
            <div className="flex flex-col gap-4 pb-3">
              <TextField
                onChange={(value) => setDraft((prev) => ({ ...prev, dateFrom: value }))}
                value={draft.dateFrom}
              >
                <Label>Date from</Label>
                <Input placeholder="YYYY-MM-DD" type="date" variant="secondary" />
                {/* Show the inherited default as a caption so the
                    operator understands what a blank field means. */}
                <FilterHint fallback="No lower bound" value={dashboardDefaults?.dateFrom} />
              </TextField>

              <TextField
                onChange={(value) => setDraft((prev) => ({ ...prev, dateTo: value }))}
                value={draft.dateTo}
              >
                <Label>Date to</Label>
                <Input placeholder="YYYY-MM-DD" type="date" variant="secondary" />
                <FilterHint fallback="No upper bound" value={dashboardDefaults?.dateTo} />
              </TextField>

              <TextField
                onChange={(value) => setDraft((prev) => ({ ...prev, branchId: value }))}
                value={draft.branchId}
              >
                <Label>Branch ID</Label>
                <Input placeholder="branch-uuid" variant="secondary" />
                <FilterHint fallback="Every branch" value={dashboardDefaults?.scope?.branchId} />
              </TextField>
            </div>
          </Drawer.Body>
          {/*
           * WHY the border-t + pt-3 on the footer: pairs the drawer
           * with the widget-catalogue-drawer and notification-bell so
           * every right-edge panel in the app ends with the same
           * separator + spacing rhythm.
           */}
          <Drawer.Footer className="border-t border-border pt-3">
            {/* Reset lives on the left so it stays out of the
                primary action's path. Rendered as ghost so the user
                notices it without it competing with Save. */}
            <Button isDisabled={!hasOverride} onPress={handleReset} size="sm" variant="ghost">
              <Iconify className="size-4" icon="arrow-uturn-cw-left" />
              Reset
            </Button>
            <div className="flex-1" />
            <Button onPress={() => onOpenChange(false)} size="sm" variant="secondary">
              Cancel
            </Button>
            <Button onPress={handleSave} size="sm" variant="primary">
              Apply
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

/**
 * Small caption rendered under a filter input. Shows what the
 * widget will inherit when the field is left blank, so the operator
 * doesn't have to open the customise panel to check the default.
 */
function FilterHint({
  fallback,
  value,
}: {
  fallback: string;
  value: string | undefined;
}): ReactNode {
  return (
    <p className="mt-1 text-xs leading-5 text-muted">
      Inherits from dashboard:{" "}
      <span className="font-medium text-foreground">{value?.trim() || fallback}</span>
    </p>
  );
}
