/**
 * @file list.tsx
 * @module modules/branches/pages/list
 *
 * @description
 * Branches list — venues within the active organization (scoped by
 * `organization`), with city, status, capacity, and default flag. Per-row
 * show/edit/delete actions.
 */

import { Chip } from "@academorix/ui/react";

import type { Branch } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";

/** DataGrid columns for the branches list. */
const COLUMNS: DataGridColumn<Branch>[] = [
  {
    id: "name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 200,
    cell: (branch) => <span className="font-medium">{branch.name}</span>,
  },
  { id: "city", header: "City", allowsSorting: true, cell: (branch) => branch.city },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (branch) => <EntityStatusChip status={branch.status} />,
  },
  { id: "capacity", header: "Capacity", allowsSorting: true, cell: (branch) => branch.capacity },
  {
    id: "is_default",
    header: "Default",
    cell: (branch) =>
      branch.is_default ? (
        <Chip size="sm" variant="soft">
          Default
        </Chip>
      ) : (
        "—"
      ),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (branch) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View branch"
          recordItemId={branch.id}
          resource="branches"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit branch"
          recordItemId={branch.id}
          resource="branches"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete branch"
          recordItemId={branch.id}
          resource="branches"
          size="sm"
        />
      </div>
    ),
  },
];

/** The branches list page. */
export default function BranchList(): ReactNode {
  return (
    <ListView resource="branches">
      <ResourceDataGrid<Branch>
        ariaLabel="Branches"
        columns={COLUMNS}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="branches"
      />
    </ListView>
  );
}
