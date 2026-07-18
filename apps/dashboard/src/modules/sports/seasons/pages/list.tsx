/**
 * @file list.tsx
 * @module modules/sports/seasons/pages/list
 *
 * @description
 * Seasons list — the tenant's registration/competition periods, with status,
 * date range, and current flag. Per-row show/edit/delete actions.
 */

import { Chip } from "@stackra/ui/react";

import type { Season } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDate } from "@/lib/format";
import { SeasonStatusChip } from "@/modules/sports/seasons/components/season-status-chip";

/** DataGrid columns for the seasons list. */
const COLUMNS: DataGridColumn<Season>[] = [
  {
    id: "name",
    header: "Season",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 160,
    cell: (season) => <span className="font-medium">{season.name}</span>,
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (season) => <SeasonStatusChip status={season.status} />,
  },
  {
    id: "start_date",
    header: "Start",
    allowsSorting: true,
    cell: (season) => formatDate(season.start_date),
  },
  {
    id: "end_date",
    header: "End",
    allowsSorting: true,
    cell: (season) => formatDate(season.end_date),
  },
  {
    id: "is_current",
    header: "Current",
    cell: (season) =>
      season.is_current ? (
        <Chip color="success" size="sm" variant="soft">
          Current
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
    cell: (season) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View season"
          recordItemId={season.id}
          resource="seasons"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit season"
          recordItemId={season.id}
          resource="seasons"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete season"
          recordItemId={season.id}
          resource="seasons"
          size="sm"
        />
      </div>
    ),
  },
];

/** The seasons list page. */
export default function SeasonList(): ReactNode {
  return (
    <ListView resource="seasons">
      <ResourceDataGrid<Season>
        ariaLabel="Seasons"
        columns={COLUMNS}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "start_date", order: "desc" }]}
        resource="seasons"
      />
    </ListView>
  );
}
