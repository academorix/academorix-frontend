/**
 * @file list.tsx
 * @module modules/sports/sessions/pages/list
 *
 * @description
 * Private sessions list (scoped by branch + season) — 1:1 coaching bookings.
 * Coach and athlete names are resolved from the `staff` and `athletes` resources
 * so the grid shows human labels, not ids. Per-row show/edit/delete actions.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, PrivateSession, Staff } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDateTime, formatMoney } from "@/lib/format";
import { EventStatusChip } from "@/modules/sports/events/components/event-status-chip";

/** The private sessions list page. */
export default function SessionList(): ReactNode {
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });

  // Build id → display-name maps so the grid can show names, not raw ids.
  const coachName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staffResult?.data ?? []) {
      map.set(member.id, `${member.first_name} ${member.last_name}`);
    }

    return map;
  }, [staffResult?.data]);

  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  const columns = useMemo<DataGridColumn<PrivateSession>[]>(
    () => [
      {
        id: "coach_id",
        header: "Coach",
        isRowHeader: true,
        minWidth: 180,
        cell: (session) => (
          <span className="font-medium">{coachName.get(session.coach_id) ?? session.coach_id}</span>
        ),
      },
      {
        id: "athlete_id",
        header: "Athlete",
        minWidth: 180,
        cell: (session) => athleteName.get(session.athlete_id) ?? session.athlete_id,
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
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (session) => <EventStatusChip status={session.status} />,
      },
      {
        id: "price",
        header: "Price",
        cell: (session) => formatMoney(session.price, session.currency ?? "USD"),
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
              resource="private-sessions"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit session"
              recordItemId={session.id}
              resource="private-sessions"
              size="sm"
              variant="ghost"
            />
            <DeleteButton
              isIconOnly
              aria-label="Delete session"
              recordItemId={session.id}
              resource="private-sessions"
              size="sm"
            />
          </div>
        ),
      },
    ],
    [coachName, athleteName],
  );

  return (
    <ListView resource="private-sessions">
      <ResourceDataGrid<PrivateSession>
        ariaLabel="Private sessions"
        columns={columns}
        contentClassName="min-w-[860px]"
        initialSorters={[{ field: "starts_at", order: "desc" }]}
        resource="private-sessions"
      />
    </ListView>
  );
}
