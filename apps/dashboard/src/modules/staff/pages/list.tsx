/**
 * @file list.tsx
 * @module modules/staff/pages/list
 *
 * @description
 * Staff list (scoped by branch) — name, title, employment, and status. Per-row
 * show/edit/delete actions.
 */

import type { Staff } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { StaffStatusChip } from "@/modules/staff/components/staff-status-chip";
import { STAFF_EMPLOYMENT_TYPE_LABELS } from "@/types";

/** DataGrid columns for the staff list. */
const COLUMNS: DataGridColumn<Staff>[] = [
  {
    id: "first_name",
    header: "Name",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (staff) => (
      <span className="font-medium">
        {staff.first_name} {staff.last_name}
      </span>
    ),
  },
  { id: "title", header: "Title", allowsSorting: true, cell: (staff) => staff.title },
  {
    id: "employment_type",
    header: "Employment",
    cell: (staff) => STAFF_EMPLOYMENT_TYPE_LABELS[staff.employment_type],
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (staff) => <StaffStatusChip status={staff.status} />,
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (staff) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View staff"
          recordItemId={staff.id}
          resource="staff"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit staff"
          recordItemId={staff.id}
          resource="staff"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete staff"
          recordItemId={staff.id}
          resource="staff"
          size="sm"
        />
      </div>
    ),
  },
];

/** The staff list page. */
export default function StaffList(): ReactNode {
  return (
    <ListView resource="staff">
      <ResourceDataGrid<Staff>
        ariaLabel="Staff"
        columns={COLUMNS}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "first_name", order: "asc" }]}
        resource="staff"
      />
    </ListView>
  );
}
