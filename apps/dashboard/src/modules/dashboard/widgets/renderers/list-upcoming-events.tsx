/**
 * @file list-upcoming-events.tsx
 * @module modules/dashboard/widgets/renderers/list-upcoming-events
 *
 * @description
 * Overview widget: the next five upcoming events in the active scope, ordered
 * by start time. Falls back to the mock fixture until the backend aggregate
 * endpoint lands; the shape is a plain `useList` sorted by `start_at`.
 */

import { CalendarIcon } from "@stackra/ui/icons/heroicon/outline";
import { Chip, Link, Skeleton, Widget } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

/** Event-shaped fields we consume for the widget row. */
interface EventLike extends BaseRecord {
  title?: string;
  name?: string;
  start_at?: string;
  starts_at?: string;
  kind?: string;
  type?: string;
}

/** Human-friendly formatter for a start timestamp. */
function formatStart(input: string | undefined): string {
  if (!input) {
    return "-";
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    return input;
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "short",
  });
}

/** Overview widget: upcoming events list. */
export default function ListUpcomingEventsWidget(): ReactNode {
  const nowIso = new Date().toISOString();

  const { result, query } = useList<EventLike>({
    resource: "events",
    pagination: { currentPage: 1, pageSize: 5 },
    sorters: [{ field: "start_at", order: "asc" }],
    filters: [{ field: "start_at", operator: "gte", value: nowIso }],
  });

  const rows = result.data ?? [];

  return (
    <Widget className="h-full">
      <Widget.Header>
        <Widget.Title>Upcoming events</Widget.Title>
        <Widget.Description>The next five events in the active scope.</Widget.Description>
      </Widget.Header>
      <Widget.Content>
        {query.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
            <CalendarIcon aria-hidden="true" className="size-4" />
            No events on the horizon.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {rows.map((row) => {
              const title = row.title ?? row.name ?? "Untitled event";
              const start = row.start_at ?? row.starts_at;
              const kind = row.kind ?? row.type;

              return (
                <li
                  key={String(row.id)}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-default/50"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{title}</span>
                    <span className="text-xs text-muted">{formatStart(start)}</span>
                  </div>
                  {kind ? (
                    <Chip size="sm" variant="secondary">
                      <Chip.Label className="capitalize">{kind}</Chip.Label>
                    </Chip>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Widget.Content>
      <Widget.Footer>
        <Link className="text-sm" href="/events">
          View all events
        </Link>
      </Widget.Footer>
    </Widget>
  );
}
