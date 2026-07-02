/**
 * @file athlete-list-page.tsx
 * @module modules/athletes/pages/athlete-list-page
 *
 * @description
 * The flagship resource screen: a paginated, sortable Athletes table driven by
 * Refine's headless `useTable` and rendered with HeroUI Pro's `DataGrid`.
 *
 * The intended pattern for every resource table:
 * - `useTable` owns server state (pagination, sorting, fetching) — identical in
 *   mock and REST modes.
 * - `DataGrid` renders the grid in **controlled sort** mode; sorting is
 *   delegated to the server via Refine's `sorters` (never sorted client-side).
 * - Pagination is a separate `Pagination` footer wired to `currentPage`.
 * - The page title uses tenant terminology (an academy shows "Students").
 */

import { Chip, DataGrid, Pagination, Spinner } from "@academorix/ui/react";
import { useTable } from "@refinedev/core";

import type { Athlete, EntityStatus } from "@/types";
import type { DataGridColumn, DataGridSortDescriptor } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { useResourceLabel } from "@/lib/refine";
import { ENTITY_STATUS_LABELS, SKILL_LEVEL_LABELS } from "@/types";

/** Maps an athlete status to a HeroUI Chip color. */
const STATUS_COLOR: Record<EntityStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  pending: "warning",
  archived: "danger",
  inactive: "default",
};

/** Formats an ISO timestamp as a short, locale-aware date. */
function formatDate(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

/**
 * DataGrid column definitions. Each column `id` doubles as the sort field sent
 * to the server, so the `Name` column sorts by `first_name`.
 */
const COLUMNS: DataGridColumn<Athlete>[] = [
  {
    id: "first_name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (athlete) => (
      <span className="font-medium">
        {athlete.first_name} {athlete.last_name}
      </span>
    ),
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    allowsSorting: true,
    minWidth: 200,
  },
  {
    id: "level",
    header: "Level",
    allowsSorting: true,
    cell: (athlete) => (athlete.level ? SKILL_LEVEL_LABELS[athlete.level] : "—"),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (athlete) => (
      <Chip color={STATUS_COLOR[athlete.status]} size="sm" variant="soft">
        {ENTITY_STATUS_LABELS[athlete.status]}
      </Chip>
    ),
  },
  {
    id: "enrolled_at",
    header: "Enrolled",
    align: "end",
    allowsSorting: true,
    cell: (athlete) => formatDate(athlete.enrolled_at),
  },
];

/** The athletes list page. */
export default function AthleteListPage(): ReactNode {
  const title = useResourceLabel("athletes", "Athletes");

  const { tableQuery, sorters, setSorters, currentPage, setCurrentPage, pageSize, pageCount } =
    useTable<Athlete>({
      resource: "athletes",
      pagination: { pageSize: 10 },
      sorters: { initial: [{ field: "enrolled_at", order: "desc" }] },
    });

  const athletes = tableQuery.data?.data ?? [];
  const total = tableQuery.data?.total ?? 0;
  const isLoading = tableQuery.isLoading;

  // Bridge Refine sorters <-> DataGrid SortDescriptor (single-column sort).
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

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{total} enrolled</p>
      </header>

      <DataGrid
        aria-label={title}
        columns={COLUMNS}
        contentClassName="min-w-[720px]"
        data={athletes}
        getRowId={(athlete) => athlete.id}
        renderEmptyState={() => (
          <div className="flex h-40 items-center justify-center">
            {isLoading ? (
              <Spinner aria-label="Loading" />
            ) : (
              <span className="text-sm text-muted">No records found.</span>
            )}
          </div>
        )}
        sortDescriptor={sortDescriptor}
        variant="primary"
        onSortChange={handleSortChange}
      />

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
              <Pagination.Link isActive={page === currentPage} onPress={() => setCurrentPage(page)}>
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
    </div>
  );
}
