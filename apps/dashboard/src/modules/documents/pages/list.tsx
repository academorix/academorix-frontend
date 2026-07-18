/**
 * @file list.tsx
 * @module modules/documents/pages/list
 *
 * @description
 * Documents list — every stored artefact for the active tenant, with the
 * classification icon, filename, owner scope, size, uploader, expiry, and
 * virus-scan status. Filters chip bar surfaces the three canonical filter
 * dimensions (type, scope, status) and reflects them back to the caller so
 * they can be cleared individually or all at once.
 */

import { AdjustmentsHorizontalIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Dropdown, Label } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useMemo, useState } from "react";

import type { Document, DocumentOwnerType } from "@/modules/documents/documents.types";
import type { Athlete, Staff, User } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { CrudFilter } from "@refinedev/core";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { DocumentScopeBadge } from "@/modules/documents/components/document-scope-badge";
import { DocumentStatusChip } from "@/modules/documents/components/document-status-chip";
import { DocumentTypeChip } from "@/modules/documents/components/document-type-chip";
import {
  DOCUMENT_SCOPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  formatByteSize,
  iconForDocumentType,
  labelForDocumentType,
} from "@/modules/documents/documents.config";

// ─────────────────────────────────────────────────────────────────────────────
// Filter model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single active filter selection tracked in local state. Each entry
 * corresponds to a chip rendered above the DataGrid; clearing the chip
 * removes the entry.
 */
interface DocumentFilter {
  /** Dimension being filtered — matches the backend query param names. */
  dimension: "by_type" | "by_scope" | "by_status";
  /** Selected raw value (unlabeled). */
  value: string;
}

/**
 * Turns the local filter state into the shape a Refine data provider expects
 * for permanent filters. Uses the backend's snake-case query param names
 * (`by_type`, `by_scope`, `by_status`) so the JSON fixture endpoint and the
 * eventual DB-backed shape stay compatible.
 *
 * Exported so a future revision can plumb this into a bespoke `useTable`
 * call once the shared {@link ResourceDataGrid} learns to accept an
 * extra-filters prop.
 *
 * @param filters - The active filter entries.
 * @returns Refine `CrudFilter` array ready to feed `useTable`.
 */
export function toRefineFilters(filters: DocumentFilter[]): CrudFilter[] {
  return filters.map((filter) => ({
    field: filter.dimension,
    operator: "eq" as const,
    value: filter.value,
  }));
}

/** Renders a human label for a filter selection, used inside filter chips. */
function labelForFilter(filter: DocumentFilter): string {
  switch (filter.dimension) {
    case "by_type":
      return `Type: ${
        DOCUMENT_TYPE_LABELS[filter.value as keyof typeof DOCUMENT_TYPE_LABELS] ??
        filter.value.replaceAll("_", " ")
      }`;
    case "by_scope":
      return `Scope: ${DOCUMENT_SCOPE_LABELS[filter.value as DocumentOwnerType] ?? filter.value}`;
    case "by_status":
      return `Status: ${
        DOCUMENT_STATUS_LABELS[filter.value as keyof typeof DOCUMENT_STATUS_LABELS] ?? filter.value
      }`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Owner-name resolver
// ─────────────────────────────────────────────────────────────────────────────

/** Owner-name resolver map, keyed by `owner_type` first, then `owner_id`. */
type OwnerNameLookup = Record<string, Map<string, string>>;

/**
 * Builds an owner-name lookup so `owner_id` values in the table can be
 * displayed as human names instead of opaque ids. Each owner type is
 * resolved from its own resource (athletes, staff, users) with pagination
 * disabled so the whole tenant set is available in memory.
 */
function useOwnerNames(): OwnerNameLookup {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: usersResult } = useList<User>({
    resource: "users",
    pagination: { mode: "off" },
  });

  return useMemo(() => {
    const lookup: OwnerNameLookup = {
      athlete: new Map<string, string>(),
      staff: new Map<string, string>(),
      user: new Map<string, string>(),
    };

    for (const athlete of athletesResult?.data ?? []) {
      lookup.athlete?.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }
    for (const member of staffResult?.data ?? []) {
      lookup.staff?.set(member.id, `${member.first_name} ${member.last_name}`);
    }
    for (const user of usersResult?.data ?? []) {
      lookup.user?.set(user.id, `${user.first_name} ${user.last_name}`);
    }

    return lookup;
  }, [athletesResult?.data, staffResult?.data, usersResult?.data]);
}

// ─────────────────────────────────────────────────────────────────────────────
// The list page
// ─────────────────────────────────────────────────────────────────────────────

/** The documents list page. */
export default function DocumentsList(): ReactNode {
  const ownerNames = useOwnerNames();
  const [filters, setFilters] = useState<DocumentFilter[]>([]);

  const addFilter = (filter: DocumentFilter): void => {
    setFilters((current) => {
      // Enforce a single value per dimension so re-selecting a different
      // status simply swaps the chip rather than accumulating chips.
      const withoutDimension = current.filter((entry) => entry.dimension !== filter.dimension);

      return [...withoutDimension, filter];
    });
  };

  const clearFilter = (dimension: DocumentFilter["dimension"]): void => {
    setFilters((current) => current.filter((entry) => entry.dimension !== dimension));
  };

  const filterChips = useMemo(
    () =>
      filters.map((filter) => ({
        id: `${filter.dimension}:${filter.value}`,
        label: labelForFilter(filter),
        onClear: () => clearFilter(filter.dimension),
      })),
    [filters],
  );

  const columns = useMemo<DataGridColumn<Document>[]>(
    () => [
      {
        id: "type",
        header: "Type",
        allowsSorting: true,
        minWidth: 56,
        cell: (record) => {
          const Icon = iconForDocumentType(record.type);
          const label = labelForDocumentType(record.type);

          return (
            <span aria-label={label} title={label}>
              <Icon aria-hidden="true" className="size-5 text-muted" />
            </span>
          );
        },
      },
      {
        id: "filename",
        header: "Title",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 220,
        cell: (record) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{record.filename}</span>
            <DocumentTypeChip hideIcon type={record.type} />
          </div>
        ),
      },
      {
        id: "owner",
        header: "Scope",
        minWidth: 200,
        cell: (record) => (
          <DocumentScopeBadge
            ownerId={record.owner_id}
            ownerName={ownerNames[record.owner_type]?.get(record.owner_id) ?? null}
            scope={record.owner_type}
          />
        ),
      },
      {
        id: "size_bytes",
        header: "Size",
        allowsSorting: true,
        cell: (record) => <span className="tabular-nums">{formatByteSize(record.size_bytes)}</span>,
      },
      {
        id: "uploaded_by",
        header: "Uploader",
        minWidth: 160,
        cell: (record) =>
          record.uploaded_by
            ? (ownerNames.user?.get(record.uploaded_by) ?? record.uploaded_by)
            : "—",
      },
      {
        id: "expiry_at",
        header: "Expires",
        allowsSorting: true,
        cell: (record) => formatDate(record.expiry_at),
      },
      {
        id: "scan_status",
        header: "Scan",
        allowsSorting: true,
        cell: (record) => <DocumentStatusChip status={record.scan_status} />,
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (record) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View document"
              recordItemId={record.id}
              resource="documents"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [ownerNames],
  );

  return (
    <ListView resource="documents">
      <ResourceDataGrid<Document>
        ariaLabel="Documents"
        columns={columns}
        contentClassName="min-w-[900px]"
        filterChips={filterChips}
        initialSorters={[{ field: "uploaded_at", order: "desc" }]}
        resource="documents"
        toolbar={
          <DocumentsFilterBar activeFilters={filters} onClear={clearFilter} onSelect={addFilter} />
        }
        onClearFilters={() => setFilters([])}
      />
    </ListView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter dropdown row
// ─────────────────────────────────────────────────────────────────────────────

/** Props for the {@link DocumentsFilterBar} composite. */
interface DocumentsFilterBarProps {
  activeFilters: DocumentFilter[];
  onSelect: (filter: DocumentFilter) => void;
  onClear: (dimension: DocumentFilter["dimension"]) => void;
}

/**
 * The three-dropdown filter row rendered as the DataGrid's toolbar slot.
 * Each dropdown offers the known options for its dimension; picking a
 * value replaces any prior selection on that dimension.
 */
function DocumentsFilterBar({
  activeFilters,
  onSelect,
  onClear,
}: DocumentsFilterBarProps): ReactNode {
  const activeByDimension = new Map(
    activeFilters.map((filter) => [filter.dimension, filter.value] as const),
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
      <span className="ms-1 flex items-center gap-1 text-xs font-medium text-muted uppercase">
        <AdjustmentsHorizontalIcon aria-hidden="true" className="size-4" />
        Filters
      </span>

      <FilterDropdown
        activeValue={activeByDimension.get("by_type") ?? null}
        entries={Object.entries(DOCUMENT_TYPE_LABELS)}
        label="Type"
        onSelect={(value) =>
          value === null ? onClear("by_type") : onSelect({ dimension: "by_type", value })
        }
      />

      <FilterDropdown
        activeValue={activeByDimension.get("by_scope") ?? null}
        entries={Object.entries(DOCUMENT_SCOPE_LABELS)}
        label="Scope"
        onSelect={(value) =>
          value === null ? onClear("by_scope") : onSelect({ dimension: "by_scope", value })
        }
      />

      <FilterDropdown
        activeValue={activeByDimension.get("by_status") ?? null}
        entries={Object.entries(DOCUMENT_STATUS_LABELS)}
        label="Status"
        onSelect={(value) =>
          value === null ? onClear("by_status") : onSelect({ dimension: "by_status", value })
        }
      />
    </div>
  );
}

/** Props for {@link FilterDropdown}. */
interface FilterDropdownProps {
  label: string;
  entries: [string, string][];
  activeValue: string | null;
  onSelect: (value: string | null) => void;
}

/** Sentinel key that clears the dimension when picked. */
const CLEAR_ITEM_KEY = "__any__";

/**
 * A single dimension's filter dropdown. Selecting the sentinel `__any__`
 * item clears the dimension; a string value scopes it. Menus close on
 * selection courtesy of the underlying HeroUI compound.
 */
function FilterDropdown({ label, entries, activeValue, onSelect }: FilterDropdownProps): ReactNode {
  const activeLabel = activeValue
    ? (entries.find(([key]) => key === activeValue)?.[1] ?? activeValue)
    : null;

  return (
    <Dropdown>
      <Button size="sm" variant="tertiary">
        {label}
        {activeLabel ? <span className="text-muted">: {activeLabel}</span> : null}
      </Button>
      <Dropdown.Popover className="min-w-[200px]">
        <Dropdown.Menu
          onAction={(key) => {
            if (String(key) === CLEAR_ITEM_KEY) {
              onSelect(null);

              return;
            }

            onSelect(String(key));
          }}
        >
          <Dropdown.Item
            key={CLEAR_ITEM_KEY}
            id={CLEAR_ITEM_KEY}
            textValue={`Any ${label.toLowerCase()}`}
          >
            <Label>Any {label.toLowerCase()}</Label>
          </Dropdown.Item>
          {entries.map(([value, entryLabel]) => (
            <Dropdown.Item key={value} id={value} textValue={entryLabel}>
              <Label>{entryLabel}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
