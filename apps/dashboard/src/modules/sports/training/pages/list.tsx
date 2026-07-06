/**
 * @file list.tsx
 * @module modules/sports/training/pages/list
 *
 * @description
 * Training sessions list (scoped by branch + season) — coached practices with
 * title, start, duration, and status. Per-row show/edit/delete actions.
 */

import type { TrainingSession } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { EventStatusChip } from "@/modules/sports/events/components/event-status-chip";

/** DataGrid columns for the training list. */
const COLUMNS: DataGridColumn<TrainingSession>[] = [
  {
    id: "title",
    header: "Title",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 220,
    cell: (session) => <span className="font-medium">{session.title}</span>,
  },
  {
    id: "starts_at",
    header: "Starts",
    allowsSorting: true,
    minWidth: 170,
    cell: (session) => formatDateTime(session.starts_at),
  },
  {
    id: "duration_minutes",
    header: "Duration",
    cell: (session) => `${session.duration_minutes}m`,
  },
  { id: "focus", header: "Focus", cell: (session) => session.focus ?? "—" },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (session) => <EventStatusChip status={session.status} />,
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (session) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View session"
          recordItemId={session.id}
          resource="training-sessions"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit session"
          recordItemId={session.id}
          resource="training-sessions"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete session"
          recordItemId={session.id}
          resource="training-sessions"
          size="sm"
        />
      </div>
    ),
  },
];

/** The training sessions list page. */
export default function TrainingList(): ReactNode {
  return (
    <ListView resource="training-sessions">
      <ResourceDataGrid<TrainingSession>
        ariaLabel="Training sessions"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "starts_at", order: "desc" }]}
        resource="training-sessions"
      />
    </ListView>
  );
}
