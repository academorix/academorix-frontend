/**
 * @file resource-data-grid.tsx
 * @module components/refine/resource-data-grid
 *
 * @description
 * A reusable bridge between Refine's headless `useTable` and HeroUI Pro's
 * `DataGrid`. Callers supply column definitions and the resource; this component
 * owns the data fetching, the **single-column** sort bridge (DataGrid
 * `SortDescriptor` ⇄ Refine `sorters`, sent to the server), the empty/loading
 * state, and a `Pagination` footer wired to `useTable`.
 *
 * This is the standard way to render a resource table across the app — feature
 * modules provide columns, not table plumbing. Server-side pagination/sorting
 * behaves identically under the mock and REST data providers.
 */

import { DataGrid, Pagination, Spinner } from "@academorix/ui/react";
import { useTable } from "@refinedev/core";

import type { DataGridColumn, DataGridSortDescriptor } from "@academorix/ui/react";
import type { BaseRecord, CrudSort } from "@refinedev/core";
import type { ReactNode } from "react";

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
  /** Message shown when there are no records. Defaults to "No records found." */
  emptyMessage?: string;
}

/**
 * Renders a paginated, sortable resource table.
 *
 * @typeParam TData - The record shape for a row.
 * @param props - Columns, resource, and presentation options.
 */
export function ResourceDataGrid<TData extends BaseRecord>({
  columns,
  ariaLabel,
  resource,
  pageSize = 10,
  initialSorters,
  contentClassName,
  emptyMessage = "No records found.",
}: ResourceDataGridProps<TData>): ReactNode {
  const { tableQuery, sorters, setSorters, currentPage, setCurrentPage, pageCount } =
    useTable<TData>({
      resource,
      pagination: { pageSize },
      sorters: initialSorters ? { initial: initialSorters } : undefined,
    });

  const rows = tableQuery.data?.data ?? [];
  const total = tableQuery.data?.total ?? 0;
  const isLoading = tableQuery.isLoading;

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

  return (
    <div className="flex flex-col gap-4">
      <DataGrid
        aria-label={ariaLabel}
        columns={columns}
        contentClassName={contentClassName}
        data={rows}
        getRowId={(record) => String(record.id)}
        renderEmptyState={() => (
          <div className="flex h-40 items-center justify-center">
            {isLoading ? (
              <Spinner aria-label="Loading" />
            ) : (
              <span className="text-sm text-muted">{emptyMessage}</span>
            )}
          </div>
        )}
        sortDescriptor={sortDescriptor}
        variant="primary"
        onSortChange={handleSortChange}
      />

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
