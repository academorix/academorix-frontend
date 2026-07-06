/**
 * @file resource-data-grid.tsx
 * @module components/refine/resource-data-grid
 *
 * @description
 * A reusable bridge between Refine's headless `useTable` and HeroUI Pro's
 * `DataGrid`. Callers supply column definitions and the resource; this
 * component owns the data fetching, the **single-column** sort bridge
 * (DataGrid `SortDescriptor` ⇄ Refine `sorters`, sent to the server), the
 * empty/loading state, and a `Pagination` footer wired to `useTable`.
 *
 * Beyond the raw table plumbing, `ResourceDataGrid` also wraps the canonical
 * listing anatomy described in `DASHBOARD_UX_PLAN.md` §5.1:
 *
 * ```
 *   +------------------------------------------------------+
 *   |  Page header (title + count + primary action)        |  optional
 *   +------------------------------------------------------+
 *   |  KPI strip (KPIGroup of module-specific numbers)     |  optional
 *   +------------------------------------------------------+
 *   |  Toolbar (search, filters, sort, columns)            |  optional
 *   +------------------------------------------------------+
 *   |  Filter chips row (active filters with clear-all)    |  optional
 *   +------------------------------------------------------+
 *   |  DataGrid (with selection, sort, pinned columns)     |  required
 *   +------------------------------------------------------+
 *   |  ActionBar (bulk verbs; appears when rows selected)  |  optional
 *   +------------------------------------------------------+
 *   |  Footer pagination                                   |  auto
 *   +------------------------------------------------------+
 * ```
 *
 * Everything is opt-in — modules that only care about columns can pass the
 * minimal `{ columns, ariaLabel }` shape and get the same layout as before.
 */

import { XMarkIcon } from "@academorix/ui/icons/outline";
import {
  ActionBar,
  Button,
  Chip,
  DataGrid,
  EmptyState,
  Pagination,
  Separator,
  Spinner,
  Tooltip,
} from "@academorix/ui/react";
import { useResourceParams, useTable } from "@refinedev/core";
import { useMemo, useState } from "react";

import type { AppResourceMeta } from "@/lib/module";
import type { IconType } from "@academorix/ui/icons";
import type {
  DataGridColumn,
  DataGridSelection,
  DataGridSortDescriptor,
} from "@academorix/ui/react";
import type { BaseRecord, CrudSort } from "@refinedev/core";
import type { ReactNode } from "react";

import { buildScopeFilters, useScope } from "@/lib/scope";

/** A single active filter surfaced as a dismissable chip above the grid. */
export interface ResourceFilterChip {
  /** Stable key used for the React list; usually `<dimension>:<value>`. */
  id: string;
  /** Label rendered inside the chip, e.g. `Stage: Qualified`. */
  label: string;
  /** Called when the user clicks the close button on the chip. */
  onClear: () => void;
}

/** A single bulk verb rendered inside the {@link ActionBar}. */
export interface ResourceBulkAction<TData extends BaseRecord> {
  /** Stable identifier used by the React key. */
  id: string;
  /** Verb label shown inside the button. */
  label: string;
  /** Optional glyph rendered next to the label. */
  icon?: IconType;
  /**
   * Called with the currently-selected rows. Use the callback rather than the
   * `Selection` key set so the module can operate on the record objects
   * without a follow-up lookup.
   */
  onAction: (selected: TData[]) => void;
  /** Button variant — defaults to `ghost`; danger verbs pass `danger`. */
  variant?: "ghost" | "danger" | "secondary";
}

/** Optional page-header slot rendered above the KPI strip. */
export interface ResourcePageHeader {
  /** Page title in the tenant's terminology. */
  title: string;
  /** Optional total-count badge shown next to the title. */
  totalCount?: number;
  /** Optional description shown beneath the title. */
  description?: string;
  /** Optional right-aligned actions (usually a primary "Add" button). */
  actions?: ReactNode;
}

/** Props for {@link ResourceDataGrid}. */
export interface ResourceDataGridProps<TData extends BaseRecord> {
  /** Column definitions; each column `id` doubles as the server sort field. */
  columns: DataGridColumn<TData>[];
  /** Accessible label for the grid (also used by screen readers). */
  ariaLabel: string;
  /** Resource name; defaults to the route's resource. */
  resource?: string;
  /** Rows per page. Defaults to `10`. */
  pageSize?: number;
  /** Initial sort applied on mount. */
  initialSorters?: CrudSort[];
  /** Min-width wrapper class to keep columns legible on small screens. */
  contentClassName?: string;
  /**
   * Message shown when there are no records. Deprecated — pass a full
   * {@link ResourceDataGridProps.emptyState} instead. Kept for backwards
   * compatibility with legacy callers.
   */
  emptyMessage?: string;
  /**
   * Optional full-page-header slot rendered at the top of the listing. When
   * provided, the header row is included in the shell layout above the KPI
   * strip. Skip this if the module renders its own header outside the grid.
   */
  pageHeader?: ResourcePageHeader;
  /**
   * Optional KPI strip rendered above the toolbar. Modules typically pass a
   * `<KPIGroup>` here with two to four `KPI` cards summarising the current
   * scope.
   */
  kpi?: ReactNode;
  /**
   * Optional toolbar rendered above the filter-chips row. Modules typically
   * pass a `<ListingToolbar>` composite here.
   */
  toolbar?: ReactNode;
  /**
   * Optional list of active filter chips. Each renders as a dismissable
   * `Chip` with a close button; the trailing "Clear all" button is added
   * automatically when at least one filter is active.
   */
  filterChips?: ResourceFilterChip[];
  /**
   * Called when the user presses "Clear all" on the filter-chips row. Modules
   * that manage their own filter state wire this to reset every filter.
   */
  onClearFilters?: () => void;
  /**
   * Full empty state node rendered when the grid has no rows. Overrides
   * `emptyMessage` when both are provided.
   */
  emptyState?: ReactNode;
  /** Whether the grid supports row selection. Defaults to `false`. */
  enableSelection?: boolean;
  /**
   * Optional bulk-action verbs surfaced inside a floating `ActionBar` when
   * rows are selected. Only applied when `enableSelection` is true.
   */
  bulkActions?: ResourceBulkAction<TData>[];
}

/** Bridges a selection set + rows array to the record list a verb needs. */
function pickSelectedRecords<TData extends BaseRecord>(
  rows: TData[],
  selectedKeys: DataGridSelection,
): TData[] {
  if (selectedKeys === "all") {
    return rows;
  }

  const keys = selectedKeys as Set<string | number>;
  const set = new Set(Array.from(keys, String));

  return rows.filter((record) => set.has(String(record.id)));
}

/** Counts the selected rows across the "all" / set shapes. */
function countSelected(rows: number, selectedKeys: DataGridSelection): number {
  if (selectedKeys === "all") {
    return rows;
  }

  return (selectedKeys as Set<string | number>).size;
}

/**
 * Renders a paginated, sortable resource table with the full canonical listing
 * anatomy. See the file-level docstring for the layout diagram.
 *
 * @typeParam TData - The record shape for a row.
 * @param props - Columns, resource, and the optional listing slots.
 */
export function ResourceDataGrid<TData extends BaseRecord>({
  columns,
  ariaLabel,
  resource,
  pageSize = 10,
  initialSorters,
  contentClassName,
  emptyMessage = "No records found.",
  pageHeader,
  kpi,
  toolbar,
  filterChips,
  onClearFilters,
  emptyState,
  enableSelection = false,
  bulkActions,
}: ResourceDataGridProps<TData>): ReactNode {
  // Resolve the resource definition to read its scope sensitivity (meta.scopedBy),
  // and the active working scope, so lists are filtered to the current
  // organization/branch/season and refetch when the scope changes.
  const { resource: resourceDefinition } = useResourceParams({ resource });
  const { scope } = useScope();
  const scopedBy = (resourceDefinition?.meta as AppResourceMeta | undefined)?.scopedBy;
  const scopeFilters = buildScopeFilters(scope, scopedBy);

  const { tableQuery, sorters, setSorters, currentPage, setCurrentPage, pageCount } =
    useTable<TData>({
      resource,
      pagination: { pageSize },
      sorters: initialSorters ? { initial: initialSorters } : undefined,
      // Permanent filters compose with the user's own filters and are part of
      // the query key, so changing scope refetches automatically.
      filters: scopeFilters.length > 0 ? { permanent: scopeFilters } : undefined,
    });

  const rows = tableQuery.data?.data ?? [];
  const total = tableQuery.data?.total ?? 0;
  const isLoading = tableQuery.isLoading;

  // Selection state — only used when `enableSelection` is true. Held locally
  // so a module can wire bulk actions without owning the state itself.
  const [selectedKeys, setSelectedKeys] = useState<DataGridSelection>(new Set());
  const selectionCount = enableSelection ? countSelected(rows.length, selectedKeys) : 0;
  const selectedRecords = useMemo(
    () => (enableSelection ? pickSelectedRecords(rows, selectedKeys) : []),
    [enableSelection, rows, selectedKeys],
  );

  // Bridge Refine's sorters array <-> DataGrid's single SortDescriptor.
  const activeSorter = sorters[0];
  const sortDescriptor: DataGridSortDescriptor | undefined = activeSorter
    ? {
        column: activeSorter.field,
        direction: activeSorter.order === "asc" ? "ascending" : "descending",
      }
    : undefined;

  const handleSortChange = (descriptor: DataGridSortDescriptor): void => {
    setSorters([
      {
        field: String(descriptor.column),
        order: descriptor.direction === "ascending" ? "asc" : "desc",
      },
    ]);
  };

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  const hasActiveFilters = Boolean(filterChips && filterChips.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {pageHeader ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold text-foreground">
                {pageHeader.title}
              </h1>
              {typeof pageHeader.totalCount === "number" ? (
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">{pageHeader.totalCount}</Chip.Label>
                </Chip>
              ) : null}
            </div>
            {pageHeader.description ? (
              <p className="text-sm text-muted">{pageHeader.description}</p>
            ) : null}
          </div>
          {pageHeader.actions ? (
            <div className="flex items-center gap-2">{pageHeader.actions}</div>
          ) : null}
        </header>
      ) : null}

      {kpi}

      {toolbar}

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {filterChips!.map((chip) => (
            <Chip key={chip.id} size="sm" variant="secondary">
              <Chip.Label>{chip.label}</Chip.Label>
              <Tooltip>
                <button
                  aria-label={`Clear filter: ${chip.label}`}
                  className="text-muted hover:text-foreground"
                  type="button"
                  onClick={chip.onClear}
                >
                  <XMarkIcon aria-hidden="true" className="size-3" />
                </button>
                <Tooltip.Content>Clear filter</Tooltip.Content>
              </Tooltip>
            </Chip>
          ))}
          {onClearFilters ? (
            <Button size="sm" variant="ghost" onPress={onClearFilters}>
              Clear all
            </Button>
          ) : null}
        </div>
      ) : null}

      <DataGrid
        aria-label={ariaLabel}
        columns={columns}
        contentClassName={contentClassName}
        data={rows}
        getRowId={(record) => String(record.id)}
        renderEmptyState={() => (
          <div className="flex h-40 items-center justify-center px-4 py-6">
            {isLoading ? (
              <Spinner aria-label="Loading" />
            ) : emptyState ? (
              emptyState
            ) : (
              <EmptyState size="sm">
                <EmptyState.Header>
                  <EmptyState.Title>{emptyMessage}</EmptyState.Title>
                </EmptyState.Header>
              </EmptyState>
            )}
          </div>
        )}
        selectedKeys={enableSelection ? selectedKeys : undefined}
        selectionMode={enableSelection ? "multiple" : "none"}
        showSelectionCheckboxes={enableSelection}
        sortDescriptor={sortDescriptor}
        variant="primary"
        onSelectionChange={enableSelection ? setSelectedKeys : undefined}
        onSortChange={handleSortChange}
      />

      {enableSelection && bulkActions && bulkActions.length > 0 ? (
        <ActionBar aria-label="Bulk actions" isOpen={selectionCount > 0}>
          <ActionBar.Prefix>
            <Chip className="shrink-0 tabular-nums" size="sm">
              {selectionCount}
            </Chip>
          </ActionBar.Prefix>
          <Separator />
          <ActionBar.Content>
            {bulkActions.map((action) => {
              const Icon = action.icon;

              return (
                <Button
                  key={action.id}
                  aria-label={action.label}
                  className={action.variant === "danger" ? "bg-danger/10 text-danger" : undefined}
                  size="sm"
                  variant={action.variant === "danger" ? "ghost" : (action.variant ?? "ghost")}
                  onPress={() => action.onAction(selectedRecords)}
                >
                  {Icon ? <Icon /> : null}
                  <span className="action-bar__label">{action.label}</span>
                </Button>
              );
            })}
          </ActionBar.Content>
          <Separator />
          <ActionBar.Suffix>
            <Tooltip>
              <Button
                isIconOnly
                aria-label="Clear selection"
                size="sm"
                variant="ghost"
                onPress={() => setSelectedKeys(new Set())}
              >
                <XMarkIcon />
              </Button>
              <Tooltip.Content>Clear selection</Tooltip.Content>
            </Tooltip>
          </ActionBar.Suffix>
        </ActionBar>
      ) : null}

      {pageCount > 1 ? (
        <Pagination size="sm">
          <Pagination.Summary>
            {rangeStart} to {rangeEnd} of {total}
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={currentPage <= 1}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <Pagination.PreviousIcon />
                Prev
              </Pagination.Previous>
            </Pagination.Item>

            {pages.map((page) => (
              <Pagination.Item key={page}>
                <Pagination.Link
                  isActive={page === currentPage}
                  onPress={() => setCurrentPage(page)}
                >
                  {page}
                </Pagination.Link>
              </Pagination.Item>
            ))}

            <Pagination.Item>
              <Pagination.Next
                isDisabled={currentPage >= pageCount}
                onPress={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
              >
                Next
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      ) : null}
    </div>
  );
}
