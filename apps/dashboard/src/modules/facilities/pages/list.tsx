/**
 * @file list.tsx
 * @module modules/facilities/pages/list
 *
 * @description
 * Facilities list — bookable venues at the active branch. Renders the icon
 * glyph + name, a type chip, the resolved branch name (via
 * {@link resolveBranch}), a capacity badge, an indoor/outdoor label, and the
 * active-status chip. Supports type / indoor / active filters via a compact
 * toolbar and a dismissable filter-chip strip, plus a bulk activate /
 * deactivate verb via the ActionBar.
 *
 * We render a raw `DataGrid` (not the shared `ResourceDataGrid`) because the
 * page needs to compose user filters + the active branch scope in a single
 * `useList` call — the shared grid only surfaces the scope dimension, not
 * user filters. The trade-off is that this page owns its own pagination, sort
 * bridging, and selection state; it stays close to what the shared grid does
 * so the two look and feel identical to the user.
 */

import { XMarkIcon } from "@stackra/ui/icons/heroicon/outline";
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
} from "@stackra/ui/react";
import { useList, useUpdate } from "@refinedev/core";
import { useMemo, useState } from "react";

import type { Facility, FacilityType } from "@/modules/facilities/facilities.types";
import type { Branch } from "@/types";
import type {
  DataGridColumn,
  DataGridSelection,
  DataGridSortDescriptor,
} from "@stackra/ui/react";
import type { CrudFilter, CrudSort } from "@refinedev/core";
import type { ReactNode } from "react";

import { EditButton, ListView, ShowButton } from "@/components/refine";
import { buildScopeFilters, useScope } from "@/lib/scope";
import { FacilityCapacityBadge } from "@/modules/facilities/components/facility-capacity-badge";
import { FacilityTypeChip } from "@/modules/facilities/components/facility-type-chip";
import { FACILITY_TYPE_COLOR, FACILITY_TYPE_ICON } from "@/modules/facilities/facilities.config";
import { FACILITY_TYPE_LABELS } from "@/modules/facilities/facilities.types";

/** Number of rows per page — matches the shared `ResourceDataGrid` default. */
const PAGE_SIZE = 10;

/**
 * The three filter axes the list surfaces. `null` means "no filter" for the
 * corresponding axis, matching the semantics of a cleared filter chip.
 */
interface FacilityFilters {
  type: FacilityType | null;
  indoor: boolean | null;
  active: boolean | null;
}

/**
 * Turns the current filter state into Refine's `CrudFilter` list. Skipped axes
 * (`null`) are omitted so the backend does not receive a `field=null` filter.
 */
function toCrudFilters(filters: FacilityFilters): CrudFilter[] {
  const out: CrudFilter[] = [];

  if (filters.type) {
    out.push({ field: "type", operator: "eq", value: filters.type });
  }

  if (filters.indoor !== null) {
    out.push({ field: "indoor", operator: "eq", value: filters.indoor });
  }

  if (filters.active !== null) {
    out.push({ field: "is_active", operator: "eq", value: filters.active });
  }

  return out;
}

/**
 * Client-side sort for a paged slice of facilities. The backend is expected to
 * honour the sort field, but we replicate the ordering locally so a
 * pagination-off `useList` call renders consistently regardless of provider.
 */
function toSortComparator(sort: CrudSort | undefined) {
  if (!sort) {
    return (): number => 0;
  }

  const direction = sort.order === "asc" ? 1 : -1;

  return (a: Facility, b: Facility): number => {
    const field = sort.field as keyof Facility;
    const av = a[field];
    const bv = b[field];

    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * direction;
    }

    return String(av).localeCompare(String(bv)) * direction;
  };
}

/** Renders the icon + name cell so the row header carries the type glyph. */
function FacilityNameCell({ facility }: { facility: Facility }): ReactNode {
  const Icon = FACILITY_TYPE_ICON[facility.type];
  const color = FACILITY_TYPE_COLOR[facility.type];

  // The bg-*/10 utility is emitted on demand by Tailwind's arbitrary-values —
  // the runtime className string lists every color the icon square can take
  // so nothing gets purged in production.
  //
  // Also: the icon is decorative (the facility name is the semantic label),
  // so we mark it aria-hidden.
  const iconBg =
    color === "success"
      ? "bg-success/10 text-success"
      : color === "warning"
        ? "bg-warning/10 text-warning"
        : color === "danger"
          ? "bg-danger/10 text-danger"
          : "bg-muted/10 text-muted";

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md ${iconBg}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 truncate font-medium">{facility.name}</span>
    </div>
  );
}

/** Counts the selected rows across the "all" / set shapes. */
function countSelected(rows: number, selectedKeys: DataGridSelection): number {
  if (selectedKeys === "all") {
    return rows;
  }

  return (selectedKeys as Set<string | number>).size;
}

/** Bridges a selection set + rows array to the record list a verb needs. */
function pickSelectedRecords(rows: Facility[], selectedKeys: DataGridSelection): Facility[] {
  if (selectedKeys === "all") {
    return rows;
  }

  const set = new Set(Array.from(selectedKeys as Set<string | number>, String));

  return rows.filter((record) => set.has(String(record.id)));
}

/** The facilities list page. */
export default function FacilitiesList(): ReactNode {
  // The active scope drives the branch filter — matching the resource's
  // `scopedBy: ["branch"]` meta on the module manifest.
  const { scope } = useScope();

  const [filters, setFilters] = useState<FacilityFilters>({
    type: null,
    indoor: null,
    active: null,
  });
  const [sort, setSort] = useState<CrudSort>({ field: "name", order: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<DataGridSelection>(new Set());

  // Compose scope + user filters into a single filter array the REST provider
  // ships as `filter[branch_id]=…&filter[type]=…&filter[indoor]=…` to the
  // spatie-query-builder-backed Laravel endpoint.
  const combinedFilters = useMemo(
    () => [...buildScopeFilters(scope, ["branch"]), ...toCrudFilters(filters)],
    [scope, filters],
  );

  // Fetch all matching facilities in one shot — the tenant list is typically
  // < 50 rows so paginating on the client is safe, and it lets bulk actions
  // operate on the full filtered set (not just the current page).
  const { result: facilitiesResult, query: facilitiesQuery } = useList<Facility>({
    resource: "facilities",
    filters: combinedFilters,
    sorters: [sort],
    pagination: { mode: "off" },
  });

  const facilities = facilitiesResult?.data ?? [];

  // Resolve branch ids into names for the branch column. Fetch once, cache in
  // a Map — the same pattern used by the leads module for staff names.
  const { result: branchesResult } = useList<Branch>({
    resource: "branches",
    pagination: { mode: "off" },
  });

  const resolveBranch = useMemo(() => {
    const map = new Map<string, string>();

    for (const branch of branchesResult?.data ?? []) {
      map.set(branch.id, branch.name);
    }

    return (branchId: string): string => map.get(branchId) ?? branchId;
  }, [branchesResult?.data]);

  // useUpdate powers the bulk activate/deactivate actions. Refine batches
  // list-cache invalidation for us so the grid re-renders after all writes
  // settle without a manual refetch.
  const { mutate: update } = useUpdate();

  const columns = useMemo<DataGridColumn<Facility>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 240,
        cell: (facility) => <FacilityNameCell facility={facility} />,
      },
      {
        id: "type",
        header: "Type",
        allowsSorting: true,
        cell: (facility) => <FacilityTypeChip showIcon={false} type={facility.type} />,
      },
      {
        id: "branch_id",
        header: "Branch",
        minWidth: 160,
        cell: (facility) => resolveBranch(facility.branch_id),
      },
      {
        id: "capacity",
        header: "Capacity",
        allowsSorting: true,
        cell: (facility) => <FacilityCapacityBadge facility={facility} />,
      },
      {
        id: "indoor",
        header: "Indoor",
        cell: (facility) => {
          if (facility.indoor === null || facility.indoor === undefined) {
            // TODO(backend-endpoint): the fixture does not yet ship the
            // `indoor` column — render "—" until the backend surfaces it.
            return "—";
          }

          return (
            <Chip size="sm" variant="secondary">
              {facility.indoor ? "Indoor" : "Outdoor"}
            </Chip>
          );
        },
      },
      {
        id: "is_active",
        header: "Status",
        allowsSorting: true,
        cell: (facility) => (
          <Chip color={facility.is_active ? "success" : "default"} size="sm" variant="soft">
            {facility.is_active ? "Active" : "Inactive"}
          </Chip>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 120,
        cell: (facility) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View facility"
              recordItemId={facility.id}
              resource="facilities"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit facility"
              recordItemId={facility.id}
              resource="facilities"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [resolveBranch],
  );

  // Local pagination — slice the client-side sorted set into pages.
  const sorted = useMemo(() => [...facilities].sort(toSortComparator(sort)), [facilities, sort]);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  // Bridge Refine's sort direction <-> DataGrid's SortDescriptor. The
  // DataGrid emits its state on every user click; we translate it back to a
  // CrudSort so the sort persists across pagination.
  const sortDescriptor: DataGridSortDescriptor = {
    column: sort.field,
    direction: sort.order === "asc" ? "ascending" : "descending",
  };

  const handleSortChange = (descriptor: DataGridSortDescriptor): void => {
    setSort({
      field: String(descriptor.column),
      order: descriptor.direction === "ascending" ? "asc" : "desc",
    });
    // Reset to page 1 when re-sorting — the previous cursor is meaningless.
    setCurrentPage(1);
  };

  const filterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onClear: () => void }> = [];

    if (filters.type) {
      chips.push({
        id: `type:${filters.type}`,
        label: `Type: ${FACILITY_TYPE_LABELS[filters.type]}`,
        onClear: () => setFilters((prev) => ({ ...prev, type: null })),
      });
    }

    if (filters.indoor !== null) {
      chips.push({
        id: `indoor:${filters.indoor}`,
        label: filters.indoor ? "Indoor only" : "Outdoor only",
        onClear: () => setFilters((prev) => ({ ...prev, indoor: null })),
      });
    }

    if (filters.active !== null) {
      chips.push({
        id: `active:${filters.active}`,
        label: filters.active ? "Active only" : "Inactive only",
        onClear: () => setFilters((prev) => ({ ...prev, active: null })),
      });
    }

    return chips;
  }, [filters]);

  const clearAll = (): void => {
    setFilters({ type: null, indoor: null, active: null });
    setCurrentPage(1);
  };

  const selectionCount = countSelected(pageRows.length, selectedKeys);
  const selectedRecords = pickSelectedRecords(pageRows, selectedKeys);

  const applyBulkStatus = (targetActive: boolean): void => {
    // Fire one update per selected row; Refine invalidates the list cache
    // once every mutation settles.
    for (const facility of selectedRecords) {
      update({
        resource: "facilities",
        id: facility.id,
        values: { is_active: targetActive },
      });
    }

    setSelectedKeys(new Set());
  };

  return (
    <ListView resource="facilities">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Type</span>
            <select
              aria-label="Filter by type"
              className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              value={filters.type ?? ""}
              onChange={(event) => {
                const value =
                  event.target.value === "" ? null : (event.target.value as FacilityType);

                setFilters((prev) => ({ ...prev, type: value }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map((type) => (
                <option key={type} value={type}>
                  {FACILITY_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Indoor</span>
            <select
              aria-label="Filter by indoor / outdoor"
              className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              value={filters.indoor === null ? "" : filters.indoor ? "yes" : "no"}
              onChange={(event) => {
                const value = event.target.value;

                setFilters((prev) => ({
                  ...prev,
                  indoor: value === "" ? null : value === "yes",
                }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="yes">Indoor</option>
              <option value="no">Outdoor</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Status</span>
            <select
              aria-label="Filter by active status"
              className="rounded-md border border-border bg-transparent px-2 py-1 text-sm"
              value={filters.active === null ? "" : filters.active ? "yes" : "no"}
              onChange={(event) => {
                const value = event.target.value;

                setFilters((prev) => ({
                  ...prev,
                  active: value === "" ? null : value === "yes",
                }));
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </label>
        </div>

        {filterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
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
            <Button size="sm" variant="ghost" onPress={clearAll}>
              Clear all
            </Button>
          </div>
        ) : null}

        <DataGrid
          aria-label="Facilities"
          columns={columns}
          contentClassName="min-w-[900px]"
          data={pageRows}
          getRowId={(record) => String(record.id)}
          renderEmptyState={() => (
            <div className="flex h-40 items-center justify-center px-4 py-6">
              {facilitiesQuery.isLoading ? (
                <Spinner aria-label="Loading" />
              ) : (
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Title>
                      No facilities yet. Create one to get started.
                    </EmptyState.Title>
                  </EmptyState.Header>
                </EmptyState>
              )}
            </div>
          )}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          showSelectionCheckboxes
          sortDescriptor={sortDescriptor}
          variant="primary"
          onSelectionChange={setSelectedKeys}
          onSortChange={handleSortChange}
        />

        <ActionBar aria-label="Bulk actions" isOpen={selectionCount > 0}>
          <ActionBar.Prefix>
            <Chip className="shrink-0 tabular-nums" size="sm">
              {selectionCount}
            </Chip>
          </ActionBar.Prefix>
          <Separator />
          <ActionBar.Content>
            <Button
              aria-label="Activate selected facilities"
              size="sm"
              variant="ghost"
              onPress={() => applyBulkStatus(true)}
            >
              Activate
            </Button>
            <Button
              aria-label="Deactivate selected facilities"
              className="bg-danger/10 text-danger"
              size="sm"
              variant="ghost"
              onPress={() => applyBulkStatus(false)}
            >
              Deactivate
            </Button>
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
    </ListView>
  );
}
