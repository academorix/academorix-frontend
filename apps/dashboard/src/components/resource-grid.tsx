/**
 * @file resource-grid.tsx
 * @module components/resource-grid
 *
 * @description
 * The canonical listing surface — HeroUI Pro `DataGrid` + Refine `useTable`
 * with:
 * - saved-view `Segment` above the grid (§5.6),
 * - filter-chip row for quick predicates (§5.6),
 * - free-text `SearchField` bound to a debounced Refine `or`-filter across
 *   the resource's `meta.searchFields[]` (§5.6),
 * - selection-driven `ActionBar` and per-row overflow menu,
 * - `HoldConfirm` guard on destructive verbs (§7.4),
 * - optimistic delete + 6-second undo toast (§7.5),
 * - client-side CSV export.
 *
 * Standard row / bulk actions (View / Edit / Duplicate / Delete / Export /
 * Archive) are dispatched via Refine's `useDelete`, `useCreate`, `useUpdate`,
 * `useNavigation`, and `useNotification` hooks so no manual wiring is
 * required in module manifests.
 *
 * ### Virtualisation
 *
 * Listings that routinely serve 200+ rows (people, notifications, athletes,
 * attendance) should opt into `DataGrid`'s row virtualisation via
 * `meta.virtualized: true` on the resource. The grid then renders only the
 * rows visible in the scroll viewport — DOM cost stays flat regardless of
 * dataset size. The row + header heights fall back to the DataGrid defaults
 * (`42` / `36`); override them via `meta.virtualizedRowHeight` and
 * `meta.virtualizedHeaderHeight` when a resource has a taller cell rhythm
 * (e.g. person cells with avatars).
 */

import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Pagination,
  SearchField,
  Separator,
  Spinner,
  Tooltip,
} from "@heroui/react";
import { ActionBar, DataGrid, EmptyState, Segment } from "@heroui-pro/react";
import {
  useCreate,
  useDelete,
  useNavigation,
  useNotification,
  useTable,
  useUpdate,
} from "@refinedev/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AppResourceBulkAction,
  AppResourceRowAction,
  BulkActionIntent,
  FilterChipConfig,
  ResourceActionVariant,
  RowActionIntent,
  SavedViewConfig,
} from "@/lib/module";
import type { DataGridColumn, DataGridSortDescriptor } from "@heroui-pro/react";
import type { BaseKey, BaseRecord, CrudFilter, CrudSort } from "@refinedev/core";
import type { Key, ReactNode } from "react";
import type { Selection } from "react-aria-components";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDataGridShortcuts } from "@/hooks/use-datagrid-shortcuts";
import { Iconify } from "@/icons/iconify";
import { downloadCsv, rowsToCsv } from "@/lib/csv";
import { readPersistedView, writePersistedView } from "@/lib/persisted-view";
import { useTranslate } from "@/hooks/use-translate";

const ACTION_VARIANT_MAP: Record<ResourceActionVariant, "primary" | "danger" | "ghost"> = {
  default: "ghost",
  primary: "primary",
  danger: "danger",
};

export type ResourceGridProps<T extends BaseRecord> = {
  ariaLabel: string;
  columns: DataGridColumn<T>[];
  contentClassName?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyActionLabel?: string;
  emptyActionRoute?: string;
  initialSorters?: CrudSort[];
  pageSize?: number;
  resource: string;
  toolbar?: ReactNode;
  rowActions?: AppResourceRowAction<T>[];
  bulkActions?: AppResourceBulkAction<T>[];
  filterChips?: FilterChipConfig[];
  savedViews?: SavedViewConfig[];
  /**
   * Fields to run a debounced free-text `contains` filter against.
   * When set (and non-empty) the grid renders a `SearchField` in
   * its toolbar; typing pushes an `or` filter across every field
   * into Refine's `useTable` on a 250 ms debounce. When
   * `undefined` or empty, no search input is rendered at all so
   * existing consumers stay untouched.
   */
  searchFields?: string[];
  /**
   * Optional placeholder override for the search input. Defaults
   * to `Search {resource}...` when omitted.
   */
  searchPlaceholder?: string;
  /**
   * Opt into `DataGrid` virtualisation. Only appropriate on grids that
   * expect 200+ rows in production; otherwise the extra bookkeeping
   * (fixed row height, scroll-container gymnastics) costs more than
   * it saves. When enabled you must also pass a fixed `rowHeight` +
   * `headingHeight` — sane defaults are provided for both.
   */
  virtualized?: boolean;
  /** Fixed row height in pixels for virtualised grids. */
  virtualizedRowHeight?: number;
  /** Header row height in pixels for virtualised grids. */
  virtualizedHeaderHeight?: number;
};

type PendingConfirm =
  | { scope: "row"; action: AppResourceRowAction<BaseRecord>; record: BaseRecord }
  | { scope: "bulk"; action: AppResourceBulkAction<BaseRecord>; records: BaseRecord[] };

/** Row action menu (three-dot overflow). */
function RowActionsMenu<T extends BaseRecord>({
  row,
  actions,
  onSelect,
}: {
  row: T;
  actions: AppResourceRowAction<T>[];
  onSelect: (action: AppResourceRowAction<T>, row: T) => void;
}): ReactNode {
  const t = useTranslate();
  // WHY drop `view` from the overflow: the `view` intent is now
  // promoted to a first-class inline pill (see the split
  // `__row_actions_view__` column below). Leaving it in the
  // dropdown too would double the affordance without adding
  // signal — most users would pick whichever they saw first and
  // wonder why we ship both. Filtering here (rather than at the
  // manifest level) means every existing resource keeps working
  // without a config touch.
  const visible = actions.filter((action) => {
    if (action.intent === "view") return false;
    if (action.isVisible && !action.isVisible(row)) return false;

    return true;
  });

  if (visible.length === 0) return null;

  const handleAction = (key: Key) => {
    const action = visible.find((entry) => entry.id === String(key));

    if (action) onSelect(action, row);
  };

  return (
    <Dropdown>
      <Button
        aria-label={t("actions.title", undefined, "Actions")}
        isIconOnly
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-4" icon="ellipsis" />
      </Button>
      <Dropdown.Popover className="min-w-44" placement="bottom end">
        <Dropdown.Menu onAction={handleAction}>
          {visible.map((action) => (
            <Dropdown.Item
              key={action.id}
              id={action.id}
              textValue={action.label}
              variant={action.variant === "danger" ? "danger" : undefined}
            >
              {action.icon ? <Iconify className="size-4" icon={action.icon} /> : null}
              <Label>{action.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/**
 * Inline "View" pill rendered as the first-class row action.
 *
 * The HeroUI Pro DataGrid "Users" example uses `cell: (item) =>
 * <Link>Edit</Link>` for a single inline action — we mirror that
 * pattern with a ghost `Button` so operators can jump into a
 * record with one click. When a `view` action is absent from the
 * manifest (or filtered out by `isVisible`), the cell renders
 * `null` and stays out of the tab order.
 */
function RowViewAction<T extends BaseRecord>({
  row,
  actions,
  onSelect,
}: {
  row: T;
  actions: AppResourceRowAction<T>[];
  onSelect: (action: AppResourceRowAction<T>, row: T) => void;
}): ReactNode {
  const t = useTranslate();
  // WHY `find` (not `filter[0]`): a resource might register more
  // than one view-shaped custom action (`intent: "view"`) but only
  // the first one is promoted to the inline slot — everything
  // else stays reachable through explicit custom-action wiring in
  // the manifest. Simpler than defining a "primary" flag on the
  // action shape when the majority case is exactly one view.
  const action = actions.find((entry) => {
    if (entry.intent !== "view") return false;
    if (entry.isVisible && !entry.isVisible(row)) return false;

    return true;
  });

  if (!action) return null;

  return (
    <Button
      aria-label={`${action.label} ${String(row.id)}`}
      className="gap-1.5"
      onPress={() => onSelect(action, row)}
      size="sm"
      variant="ghost"
    >
      <Iconify className="size-4" icon={action.icon ?? "eye"} />
      {t(`actions.${action.intent ?? "view"}`, undefined, action.label)}
    </Button>
  );
}

const ALL_VIEWS_KEY = "__all__";

export function ResourceGrid<T extends BaseRecord>({
  ariaLabel,
  columns,
  contentClassName,
  emptyDescription,
  emptyIcon = "database",
  emptyTitle,
  emptyActionLabel,
  emptyActionRoute,
  initialSorters,
  pageSize = 10,
  resource,
  toolbar,
  rowActions,
  bulkActions,
  filterChips,
  savedViews,
  searchFields,
  searchPlaceholder,
  virtualized = false,
  virtualizedRowHeight,
  virtualizedHeaderHeight,
}: ResourceGridProps<T>): ReactNode {
  // -------------------------------------------------------------------------
  // Saved views + filter chips state (hydrated from localStorage)
  // -------------------------------------------------------------------------
  const defaultView = savedViews?.find((view) => view.isDefault);
  const persisted = readPersistedView(resource);
  const initialView = persisted?.view ?? defaultView?.id ?? ALL_VIEWS_KEY;
  const initialChips = new Set<string>(persisted?.chipIds ?? []);

  const [activeView, setActiveView] = useState<Key>(initialView);
  const [activeChipIds, setActiveChipIds] = useState<Set<string>>(initialChips);

  const {
    currentPage,
    pageCount,
    result,
    setCurrentPage,
    setFilters,
    setSorters,
    sorters,
    tableQuery,
  } = useTable<T>({
    pagination: { currentPage: 1, pageSize },
    resource,
    sorters: { initial: initialSorters ?? defaultView?.sorters },
    filters: { initial: defaultView?.filters as CrudFilter[] | undefined },
  });

  // -------------------------------------------------------------------------
  // Free-text search — debounced 250 ms, ORed across `searchFields[]`.
  //
  // The raw `query` is what the user sees inside `SearchField`; the
  // `debouncedQuery` is what we push into `useTable` so we don't flood the
  // filter pipeline while someone is still typing. A `setTimeout` + cleanup
  // is enough here — no external `useDebounce` dependency needed.
  // -------------------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const hasSearch = Boolean(searchFields && searchFields.length > 0);

  useEffect(() => {
    if (!hasSearch) return undefined;
    // WHY: 250 ms mirrors the debounce most search UIs settle at —
    // long enough that a "typing" burst doesn't spam the filter
    // pipeline, short enough to feel responsive on keystroke pause.
    const handle = window.setTimeout(() => setDebouncedQuery(query), 250);

    return () => window.clearTimeout(handle);
  }, [query, hasSearch]);

  // Reset back to page 1 whenever the debounced query settles on a new
  // value — otherwise the user could land on page 4 of the old filter
  // and see "no results" because the new query doesn't have that many
  // matches.
  useEffect(() => {
    if (!hasSearch) return;
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Ref for `Cmd+F` / `/` — focuses the underlying `<input>` element.
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------------------------------------------------------------
  // Effect: apply saved-view filters/sorters when the view switches
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (activeView === ALL_VIEWS_KEY) {
      setFilters([], "replace");
      setActiveChipIds(new Set());

      return;
    }
    const view = savedViews?.find((v) => v.id === String(activeView));

    if (!view) return;
    setFilters((view.filters ?? []) as CrudFilter[], "replace");
    if (view.sorters?.length) setSorters(view.sorters);
    setActiveChipIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // -------------------------------------------------------------------------
  // Effect: fold chip filters + free-text search on top of the base view
  // filters. All three axes compose here so a single `setFilters` call
  // stays authoritative — otherwise the last effect to fire would
  // clobber the earlier one's contribution.
  //
  // Layering (in order they are applied):
  //   1. `baseFilters` — the active saved view's `filters[]`
  //   2. `chipFilters` — every enabled `filterChips[]` entry (AND-of-ANDs)
  //   3. `searchFilter` — one `or` filter with a `contains` clause
  //                       per `searchFields[]` entry
  //
  // The `or` search wrapper is what makes people-shaped resources feel
  // right — one query hits `fullName` + `email` at once instead of
  // silently narrowing to a single column.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const view = savedViews?.find((v) => v.id === String(activeView));
    const baseFilters = ((view?.filters ?? []) as CrudFilter[]) ?? [];
    const chipFilters: CrudFilter[] = (filterChips ?? [])
      .filter((chip) => activeChipIds.has(chip.id))
      .map(
        (chip) =>
          ({
            field: chip.filter.field,
            operator: chip.filter.operator,
            value: chip.filter.value,
          }) as CrudFilter,
      );

    const trimmed = debouncedQuery.trim();
    const searchFilter: CrudFilter[] =
      hasSearch && trimmed.length > 0
        ? [
            {
              operator: "or",
              value: (searchFields ?? []).map((field) => ({
                field,
                operator: "contains" as const,
                value: trimmed,
              })),
            } as CrudFilter,
          ]
        : [];

    setFilters([...baseFilters, ...chipFilters, ...searchFilter], "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChipIds, debouncedQuery]);

  // -------------------------------------------------------------------------
  // Effect: persist active view + chip ids to localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    writePersistedView(resource, {
      view: String(activeView),
      chipIds: Array.from(activeChipIds),
    });
  }, [resource, activeView, activeChipIds]);

  const toggleChip = (id: string) => {
    setActiveChipIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const clearAllFilters = () => {
    setActiveView(ALL_VIEWS_KEY);
    setActiveChipIds(new Set());
    setFilters([], "replace");
  };

  const hasFilterState = activeView !== ALL_VIEWS_KEY || activeChipIds.size > 0;

  // -------------------------------------------------------------------------
  // Selection state + Refine mutation hooks
  // -------------------------------------------------------------------------
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  /**
   * Keyboard cursor for J/K navigation. Kept separate from
   * `selectedKeys` so the caret can walk the grid without toggling
   * checkbox selection — `X` opts a row into the multi-select set,
   * `Enter`/`E` operate on the caret target.
   */
  const [focusedRowId, setFocusedRowId] = useState<Key | null>(null);
  /**
   * Container ref used by `useDataGridShortcuts` to check that a
   * keystroke originated from within this specific grid. Multiple
   * grids can coexist on a page — each installs its own listener but
   * only reacts when its own container owns focus.
   */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { show, edit, create: navCreate } = useNavigation();
  const { mutate: deleteOne } = useDelete();
  const { mutate: createOne } = useCreate();
  const { mutate: updateOne } = useUpdate();
  const { open: notify, close: closeNotification } = useNotification();
  const t = useTranslate();

  const rows: T[] = (result?.data ?? []) as T[];
  const total = result?.total ?? 0;
  const isLoading = tableQuery.isLoading;
  const isError = tableQuery.isError;

  const selectedRows = useMemo(() => {
    if (selectedKeys === "all") return rows;

    const ids = selectedKeys as Set<Key>;

    return rows.filter((row) => ids.has(row.id as Key));
  }, [rows, selectedKeys]);

  const selectionCount = selectedKeys === "all" ? rows.length : selectedKeys.size;
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), []);

  const notifyEvent = useCallback(
    (payload: { message: string; description?: string; type?: "success" | "error" }) =>
      notify?.({
        key: `${resource}-${Date.now()}`,
        message: payload.message,
        description: payload.description,
        type: payload.type ?? "success",
      }),
    [notify, resource],
  );

  // -------------------------------------------------------------------------
  // Delete with 6-second undo window (§7.5)
  // -------------------------------------------------------------------------
  const deleteWithUndo = useCallback(
    (record: T) => {
      const undoKey = `${resource}-undo-${record.id}-${Date.now()}`;

      // Fire the delete in `undoable` mode — Refine holds the mutation for 5s
      // before actually issuing it, giving us a natural undo window.
      deleteOne(
        {
          resource,
          id: record.id as BaseKey,
          mutationMode: "undoable",
          undoableTimeout: 6000,
        },
        {
          onSuccess: () => notifyEvent({ message: `${resource} deleted`, type: "success" }),
          onError: () => {
            // fires when the user clicks "Undo" in Refine's automatic toast
            closeNotification?.(undoKey);
          },
        },
      );
    },
    [deleteOne, resource, notifyEvent, closeNotification],
  );

  const bulkDeleteWithUndo = useCallback(
    (records: T[]) => {
      for (const record of records) {
        deleteOne({
          resource,
          id: record.id as BaseKey,
          mutationMode: "undoable",
          undoableTimeout: 6000,
        });
      }
      notifyEvent({
        message: `Deleting ${records.length} ${resource}`,
        description: "Tap Undo within 6 seconds to roll back.",
        type: "success",
      });
      clearSelection();
    },
    [deleteOne, resource, notifyEvent, clearSelection],
  );

  const runRowIntent = useCallback(
    (intent: RowActionIntent, action: AppResourceRowAction<T>, record: T) => {
      switch (intent) {
        case "view":
          show(resource, record.id as BaseKey);
          break;
        case "edit":
          edit(resource, record.id as BaseKey);
          break;
        case "duplicate": {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...values } = record as BaseRecord & Record<string, unknown>;

          createOne(
            { resource, values },
            {
              onSuccess: () => notifyEvent({ message: `${resource} duplicated`, type: "success" }),
              onError: (err) =>
                notifyEvent({
                  message: `Couldn't duplicate ${resource}`,
                  description: err?.message,
                  type: "error",
                }),
            },
          );
          break;
        }
        case "delete":
          deleteWithUndo(record);
          break;
        case "archive":
          updateOne(
            {
              resource,
              id: record.id as BaseKey,
              values: { isActive: false },
              mutationMode: "optimistic",
            },
            {
              onSuccess: () => notifyEvent({ message: `${resource} archived`, type: "success" }),
              onError: (err) =>
                notifyEvent({
                  message: `Couldn't archive ${resource}`,
                  description: err?.message,
                  type: "error",
                }),
            },
          );
          break;
        case "custom":
        default:
          if (action.run) {
            void Promise.resolve(
              action.run(record, {
                navigate: (to) => (window.location.href = to),
                notify: notifyEvent,
              }),
            );
          }
      }
    },
    [show, edit, resource, createOne, deleteWithUndo, updateOne, notifyEvent],
  );

  const runBulkIntent = useCallback(
    (intent: BulkActionIntent, action: AppResourceBulkAction<T>, records: T[]) => {
      switch (intent) {
        case "export": {
          const csv = rowsToCsv(records as Record<string, unknown>[]);
          const stamp = new Date().toISOString().slice(0, 10);

          downloadCsv(csv, `${resource}-${stamp}`);
          notifyEvent({ message: `Exported ${records.length} ${resource}`, type: "success" });
          break;
        }
        case "edit":
          if (records.length === 1) edit(resource, records[0]!.id as BaseKey);
          else notifyEvent({ message: "Bulk edit is not available yet.", type: "error" });
          break;
        case "archive":
          for (const record of records) {
            updateOne({
              resource,
              id: record.id as BaseKey,
              values: { isActive: false },
              mutationMode: "optimistic",
            });
          }
          notifyEvent({ message: `Archived ${records.length} ${resource}`, type: "success" });
          clearSelection();
          break;
        case "delete":
          bulkDeleteWithUndo(records);
          break;
        case "custom":
        default:
          if (action.run) {
            void Promise.resolve(
              action.run(records, {
                navigate: (to) => (window.location.href = to),
                notify: notifyEvent,
              }),
            );
          }
      }
    },
    [resource, edit, updateOne, bulkDeleteWithUndo, notifyEvent, clearSelection],
  );

  const handleRowAction = useCallback(
    (action: AppResourceRowAction<T>, record: T) => {
      if (action.confirm) {
        setPendingConfirm({
          scope: "row",
          action: action as AppResourceRowAction<BaseRecord>,
          record,
        });

        return;
      }
      runRowIntent(action.intent ?? "custom", action, record);
    },
    [runRowIntent],
  );

  const handleBulkAction = useCallback(
    (action: AppResourceBulkAction<T>, records: T[]) => {
      if (action.confirm) {
        setPendingConfirm({
          scope: "bulk",
          action: action as AppResourceBulkAction<BaseRecord>,
          records,
        });

        return;
      }
      runBulkIntent(action.intent ?? "custom", action, records);
    },
    [runBulkIntent],
  );

  // -------------------------------------------------------------------------
  // Keyboard shortcuts on the grid (§13.2)
  //
  //   J / K        — move the focus cursor down / up between rows
  //   Enter        — open the focused row (`show`)
  //   E            — edit the focused row
  //   X            — toggle the focused row's selection checkbox
  //   ⌘ A / Ctrl A — select every row on the current page
  //   ⌘ ⇧ A        — clear selection
  //   Del/Bksp     — delete the focused row (through the same confirm
  //                  path as the row action so undo still fires)
  //
  // The cursor is a soft focus (`focusedRowId`) not a browser focus —
  // it moves independently of the checkbox selection. If nothing is
  // focused yet, J starts on the first row.
  // -------------------------------------------------------------------------
  const focusedRecord = useMemo(
    () =>
      focusedRowId != null ? (rows.find((row) => (row.id as Key) === focusedRowId) ?? null) : null,
    [rows, focusedRowId],
  );

  const moveFocus = useCallback(
    (delta: 1 | -1) => {
      if (rows.length === 0) return;
      const currentIndex =
        focusedRowId != null ? rows.findIndex((row) => (row.id as Key) === focusedRowId) : -1;
      const nextIndex =
        currentIndex < 0
          ? delta > 0
            ? 0
            : rows.length - 1
          : Math.min(Math.max(0, currentIndex + delta), rows.length - 1);
      const nextRow = rows[nextIndex];

      if (nextRow) setFocusedRowId(nextRow.id as Key);
    },
    [rows, focusedRowId],
  );

  const shortcutOptions = useMemo(
    () => ({
      containerRef,
      onSelectNext: () => moveFocus(1),
      onSelectPrev: () => moveFocus(-1),
      onOpen: () => {
        if (focusedRecord) show(resource, focusedRecord.id as BaseKey);
      },
      onEdit: () => {
        if (focusedRecord) edit(resource, focusedRecord.id as BaseKey);
      },
      onToggleSelect: () => {
        if (!focusedRecord) return;
        setSelectedKeys((prev) => {
          const key = focusedRecord.id as string | number;

          if (prev === "all") {
            // Toggling off from an all-selection means we hop back to
            // an explicit set with every row except the caret target.
            const remaining = new Set<string | number>(
              rows.map((row) => row.id as string | number),
            );

            remaining.delete(key);

            return remaining as unknown as Selection;
          }
          const next = new Set(prev as Set<string | number>);

          if (next.has(key)) next.delete(key);
          else next.add(key);

          return next as unknown as Selection;
        });
      },
      onSelectAll: () => {
        if (rows.length === 0) return;
        setSelectedKeys(
          new Set(rows.map((row) => row.id as string | number)) as unknown as Selection,
        );
      },
      onClearSelection: () => setSelectedKeys(new Set()),
      onDelete: () => {
        if (!focusedRecord) return;
        deleteWithUndo(focusedRecord);
      },
    }),
    [containerRef, focusedRecord, moveFocus, rows, show, edit, resource, deleteWithUndo],
  );

  useDataGridShortcuts(shortcutOptions);

  // -------------------------------------------------------------------------
  // Keyboard shortcut: focus the search input on `/` or `Cmd+F` (Ctrl+F on
  // Windows/Linux). Only wired when `searchFields` is present so we never
  // pre-empt the browser's native find-in-page when there's no search UI
  // to hand over to.
  //
  // - `/` is the classic "type-to-search" affordance from Slack / GitHub /
  //   Jira; we only intercept it when focus is outside a form control so
  //   users can still type `/` inside inputs.
  // - `Cmd+F` / `Ctrl+F` overrides the browser find dialog when the grid
  //   has its own search — most users prefer the scoped resource search
  //   over the browser's document-wide match. We always preventDefault
  //   here to stop the browser dialog from popping open behind ours.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hasSearch) return undefined;

    const isFormControl = (el: EventTarget | null): boolean => {
      const node = el as HTMLElement | null;

      if (!node) return false;
      const tag = node.tagName;

      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable;
    };

    const handler = (event: KeyboardEvent) => {
      // Cmd/Ctrl + F — scoped resource find. Always claim it while the
      // grid is mounted so the browser dialog doesn't clash with the
      // in-page search UI.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();

        return;
      }
      // `/` — quick-search leader key. Skipped while typing so `/` stays
      // typable inside form fields.
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isFormControl(event.target)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [hasSearch]);

  const confirmPending = useCallback(() => {
    if (!pendingConfirm) return;
    if (pendingConfirm.scope === "row") {
      runRowIntent(
        pendingConfirm.action.intent ?? "custom",
        pendingConfirm.action as AppResourceRowAction<T>,
        pendingConfirm.record as T,
      );
    } else {
      runBulkIntent(
        pendingConfirm.action.intent ?? "custom",
        pendingConfirm.action as AppResourceBulkAction<T>,
        pendingConfirm.records as T[],
      );
    }
    setPendingConfirm(null);
  }, [pendingConfirm, runRowIntent, runBulkIntent]);

  const columnsWithRowActions = useMemo<DataGridColumn<T>[]>(() => {
    if (!rowActions || rowActions.length === 0) return columns;

    // WHY split the tail into two dedicated columns:
    //
    // 1. `__row_actions_view__` — promotes the `view` intent from
    //    the overflow dropdown into a first-class ghost pill so
    //    operators can jump into a record with a visible click
    //    target. Mirrors the HeroUI Pro DataGrid "Users" example
    //    pattern (`cell: (item) => <Link>Edit</Link>`).
    //
    // 2. `__row_actions_overflow__` — hosts every other action
    //    (edit, duplicate, delete, archive, custom). The
    //    `view` entry is filtered out inside `RowActionsMenu` so
    //    the affordance appears exactly once per row.
    //
    // Both columns pin to the trailing edge (`align: "end"`) and
    // set a `minWidth` generous enough for the inline pill + the
    // ⋮ icon side-by-side without wrap. Reserving the overflow
    // column's own minimum keeps the dropdown trigger touch-safe
    // at mobile widths.
    return [
      ...columns,
      {
        id: "__row_actions_view__",
        header: "",
        align: "end",
        minWidth: 96,
        cell: (row) => <RowViewAction actions={rowActions} onSelect={handleRowAction} row={row} />,
      },
      {
        id: "__row_actions_overflow__",
        header: "",
        align: "end",
        minWidth: 56,
        cell: (row) => <RowActionsMenu actions={rowActions} onSelect={handleRowAction} row={row} />,
      },
    ];
  }, [columns, rowActions, handleRowAction]);

  const activeSorter = sorters[0];
  const sortDescriptor: DataGridSortDescriptor | undefined = activeSorter
    ? {
        column: activeSorter.field,
        direction: activeSorter.order === "asc" ? "ascending" : "descending",
      }
    : undefined;

  const handleSortChange = (descriptor: DataGridSortDescriptor) => {
    setSorters([
      {
        field: String(descriptor.column),
        order: descriptor.direction === "ascending" ? "asc" : "desc",
      },
    ]);
  };

  const visibleBulk = (bulkActions ?? []).filter(
    (action) => !action.isVisible || action.isVisible(selectedRows),
  );

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  const confirmDescription =
    pendingConfirm?.scope === "row"
      ? pendingConfirm.action.confirm?.description
      : pendingConfirm?.scope === "bulk"
        ? pendingConfirm.action.confirm?.description
        : undefined;

  const hasSavedViews = Boolean(savedViews && savedViews.length > 0);
  const hasFilterChips = Boolean(filterChips && filterChips.length > 0);

  return (
    <>
      <div ref={containerRef} className="contents" tabIndex={-1}>
        {(hasSavedViews || hasFilterChips || hasSearch) && (
          <div className="flex flex-col gap-3">
            {hasSavedViews ? (
              <Segment
                onSelectionChange={(key) => setActiveView(key)}
                selectedKey={String(activeView)}
                size="sm"
                variant="ghost"
              >
                <Segment.Item id={ALL_VIEWS_KEY}>All</Segment.Item>
                {savedViews!.map((view) => (
                  <Segment.Item key={view.id} id={view.id}>
                    {view.label}
                  </Segment.Item>
                ))}
              </Segment>
            ) : null}

            {hasFilterChips || hasSearch ? (
              <div className="flex flex-wrap items-center gap-2">
                {hasFilterChips
                  ? filterChips!.map((chip) => {
                      const isActive = activeChipIds.has(chip.id);

                      return (
                        <button
                          key={chip.id}
                          aria-pressed={isActive}
                          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                          onClick={() => toggleChip(chip.id)}
                          type="button"
                        >
                          <Chip
                            color={isActive ? (chip.color ?? "accent") : "default"}
                            size="sm"
                            variant={isActive ? "soft" : "secondary"}
                          >
                            {chip.icon ? <Iconify className="size-3.5" icon={chip.icon} /> : null}
                            <Chip.Label>{chip.label}</Chip.Label>
                            {isActive ? <Iconify className="size-3" icon="xmark" /> : null}
                          </Chip>
                        </button>
                      );
                    })
                  : null}
                {hasFilterState ? (
                  <Button onPress={clearAllFilters} size="sm" variant="ghost">
                    Clear all
                  </Button>
                ) : null}
                {hasSearch ? (
                  // `ml-auto` pins the search input to the trailing edge so
                  // chips stay left-aligned with the grid while the search
                  // affordance mirrors the position users expect from every
                  // other admin UI (Notion / Linear / GitHub).
                  <SearchField
                    aria-label="Search"
                    className="ml-auto"
                    onChange={setQuery}
                    value={query}
                    variant="secondary"
                  >
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input
                        ref={searchInputRef}
                        className="w-[220px]"
                        placeholder={searchPlaceholder ?? `Search ${resource}...`}
                      />
                      <SearchField.ClearButton onPress={() => setQuery("")} />
                    </SearchField.Group>
                  </SearchField>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <Card>
          {toolbar ? (
            <Card.Header className="flex-row items-center justify-between gap-3">
              {toolbar}
            </Card.Header>
          ) : null}
          <Card.Content className="relative overflow-x-auto px-0 pb-0">
            {isError ? (
              <EmptyState className="py-10">
                <EmptyState.Header>
                  <EmptyState.Media variant="icon">
                    <Iconify icon="circle-exclamation" />
                  </EmptyState.Media>
                  <EmptyState.Title>
                    {t("app.error.title", undefined, "Couldn't load data")}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {t(
                      "app.error.description",
                      undefined,
                      "The request failed. Check your connection and try again.",
                    )}
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            ) : (
              <>
                <DataGrid
                  aria-label={ariaLabel}
                  columns={columnsWithRowActions}
                  contentClassName={contentClassName}
                  data={rows}
                  getRowId={(item) => item.id as BaseKey}
                  headingHeight={virtualized ? (virtualizedHeaderHeight ?? 36) : undefined}
                  onSelectionChange={setSelectedKeys}
                  onSortChange={handleSortChange}
                  rowHeight={virtualized ? (virtualizedRowHeight ?? 42) : undefined}
                  selectedKeys={selectedKeys}
                  selectionMode={bulkActions && bulkActions.length > 0 ? "multiple" : "none"}
                  showSelectionCheckboxes={Boolean(bulkActions && bulkActions.length > 0)}
                  sortDescriptor={sortDescriptor}
                  variant="secondary"
                  virtualized={virtualized || undefined}
                  renderEmptyState={() =>
                    isLoading ? (
                      <div className="py-16" />
                    ) : (
                      <EmptyState className="py-10">
                        <EmptyState.Header>
                          <EmptyState.Media variant="icon">
                            <Iconify icon={emptyIcon} />
                          </EmptyState.Media>
                          <EmptyState.Title>
                            {emptyTitle ?? t("app.emptyState.title", undefined, "No records found")}
                          </EmptyState.Title>
                          <EmptyState.Description>
                            {emptyDescription ??
                              t(
                                "app.emptyState.description",
                                undefined,
                                "There are no records to display for this view yet.",
                              )}
                          </EmptyState.Description>
                        </EmptyState.Header>
                        {emptyActionLabel ? (
                          <EmptyState.Content className="flex-row gap-2">
                            <Button
                              onPress={() =>
                                emptyActionRoute
                                  ? (window.location.pathname = emptyActionRoute)
                                  : navCreate(resource)
                              }
                              variant="primary"
                            >
                              <Iconify className="size-4" icon="plus" />
                              {emptyActionLabel}
                            </Button>
                          </EmptyState.Content>
                        ) : null}
                      </EmptyState>
                    )
                  }
                />
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/40 backdrop-blur-sm">
                    <Spinner color="accent" size="lg" />
                  </div>
                ) : null}
              </>
            )}
          </Card.Content>

          <Card.Footer className="flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-muted tabular-nums">
              {isLoading
                ? t("app.loading", undefined, "Loading…")
                : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
            </p>
            <Pagination>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={currentPage <= 1}
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    <Pagination.PreviousIcon />
                    <span className="hidden sm:inline">Previous</span>
                  </Pagination.Previous>
                </Pagination.Item>
                <Pagination.Item>
                  <span className="px-3 text-sm text-muted tabular-nums">
                    Page {currentPage} of {Math.max(1, pageCount)}
                  </span>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={currentPage >= pageCount}
                    onPress={() => setCurrentPage(currentPage + 1)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Card.Footer>
        </Card>
      </div>

      <ActionBar aria-label={t("actions.title", undefined, "Actions")} isOpen={selectionCount > 0}>
        <ActionBar.Prefix>
          <Chip className="shrink-0 tabular-nums" size="sm">
            {t("actions.selected", { count: selectionCount }, `${selectionCount} selected`)}
          </Chip>
        </ActionBar.Prefix>
        {visibleBulk.length > 0 ? <Separator /> : null}
        <ActionBar.Content>
          {visibleBulk.map((action) => (
            <Button
              key={action.id}
              className={action.variant === "danger" ? "bg-danger/10 text-danger" : undefined}
              onPress={() => handleBulkAction(action, selectedRows)}
              size="sm"
              variant={ACTION_VARIANT_MAP[action.variant ?? "default"]}
            >
              {action.icon ? <Iconify className="size-4" icon={action.icon} /> : null}
              <span className="action-bar__label">{action.label}</span>
            </Button>
          ))}
        </ActionBar.Content>
        <Separator />
        <ActionBar.Suffix>
          <Tooltip>
            <Button
              aria-label={t("actions.clearSelection", undefined, "Clear selection")}
              isIconOnly
              onPress={clearSelection}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-4" icon="xmark" />
            </Button>
            <Tooltip.Content>
              {t("actions.clearSelection", undefined, "Clear selection")}
            </Tooltip.Content>
          </Tooltip>
        </ActionBar.Suffix>
      </ActionBar>

      {pendingConfirm ? (
        <ConfirmDialog
          confirmLabel={
            pendingConfirm.scope === "row"
              ? (pendingConfirm.action.confirm?.confirmLabel ?? pendingConfirm.action.label)
              : (pendingConfirm.action.confirm?.confirmLabel ?? pendingConfirm.action.label)
          }
          description={confirmDescription}
          isDestructive={pendingConfirm.action.variant === "danger"}
          isOpen
          onConfirm={confirmPending}
          onOpenChange={(open) => {
            if (!open) setPendingConfirm(null);
          }}
          title={
            pendingConfirm.scope === "row"
              ? (pendingConfirm.action.confirm?.title ?? pendingConfirm.action.label)
              : (pendingConfirm.action.confirm?.title ?? pendingConfirm.action.label)
          }
          typeToConfirm={
            pendingConfirm.scope === "row"
              ? pendingConfirm.action.confirm?.typeToConfirm
              : pendingConfirm.action.confirm?.typeToConfirm
          }
        />
      ) : null}
    </>
  );
}
