/**
 * @file list.tsx
 * @module modules/sports/athletes/pages/list
 *
 * @description
 * Athletes list (scoped by the active branch). Typed identity columns with
 * per-row show/edit/delete actions. Sport-variable data is shown on the detail
 * screen via SDUI, not here.
 */

import type { Athlete } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate } from "@/lib/format";
import { GENDER_LABELS } from "@/types";

/** DataGrid column definitions for the athletes list. */
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
  { id: "email", header: "Email", accessorKey: "email", allowsSorting: true, minWidth: 200 },
  {
    id: "gender",
    header: "Gender",
    cell: (athlete) => (athlete.gender ? GENDER_LABELS[athlete.gender] : "—"),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (athlete) => <EntityStatusChip status={athlete.status} />,
  },
  {
    id: "enrolled_at",
    header: "Enrolled",
    allowsSorting: true,
    cell: (athlete) => formatDate(athlete.enrolled_at),
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (athlete) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete athlete"
          recordItemId={athlete.id}
          resource="athletes"
          size="sm"
        />
      </div>
    ),
  },
];

/** The athletes list page. */
export default function AthleteList(): ReactNode {
  return (
    <ListView resource="athletes">
      <ResourceDataGrid<Athlete>
        ariaLabel="Athletes"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "enrolled_at", order: "desc" }]}
        resource="athletes"
      />
    </ListView>
  );
}
