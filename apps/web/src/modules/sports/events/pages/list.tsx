/**
 * @file list.tsx
 * @module modules/sports/events/pages/list
 *
 * @description
 * Events list (scoped by branch + season) — training/matches/sessions with type,
 * start time, status, and RSVP count. Per-row show/edit/delete actions.
 */

import type { Event } from "@/types";
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
import { EVENT_TYPE_LABELS } from "@/types";

/** DataGrid columns for the events list. */
const COLUMNS: DataGridColumn<Event>[] = [
  {
    id: "title",
    header: "Title",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 200,
    cell: (event) => <span className="font-medium">{event.title}</span>,
  },
  { id: "type", header: "Type", cell: (event) => EVENT_TYPE_LABELS[event.type] },
  {
    id: "starts_at",
    header: "Starts",
    allowsSorting: true,
    minWidth: 170,
    cell: (event) => formatDateTime(event.starts_at),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (event) => <EventStatusChip status={event.status} />,
  },
  {
    id: "rsvp",
    header: "RSVP",
    cell: (event) => `${event.rsvp_going}/${event.rsvp_total}`,
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (event) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View event"
          recordItemId={event.id}
          resource="events"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit event"
          recordItemId={event.id}
          resource="events"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete event"
          recordItemId={event.id}
          resource="events"
          size="sm"
        />
      </div>
    ),
  },
];

/** The events list page. */
export default function EventList(): ReactNode {
  return (
    <ListView resource="events">
      <ResourceDataGrid<Event>
        ariaLabel="Events"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "starts_at", order: "desc" }]}
        resource="events"
      />
    </ListView>
  );
}
