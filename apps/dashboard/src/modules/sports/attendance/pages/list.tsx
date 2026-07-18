/**
 * @file list.tsx
 * @module modules/sports/attendance/pages/list
 *
 * @description
 * Attendance capture surface (scoped by branch) — one row per athlete mark, with
 * an inline status control and a confirmation flag. Athlete names are resolved
 * from the `athletes` resource.
 */

import { Chip } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, Attendance } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { AttendanceStatusCell } from "@/modules/sports/attendance/components/attendance-status-cell";

/** The attendance capture list page. */
export default function AttendanceList(): ReactNode {
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });

  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  const columns = useMemo<DataGridColumn<Attendance>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Athlete",
        isRowHeader: true,
        minWidth: 200,
        cell: (record) => (
          <span className="font-medium">
            {athleteName.get(record.athlete_id) ?? record.athlete_id}
          </span>
        ),
      },
      { id: "event_id", header: "Event", minWidth: 180, cell: (record) => record.event_id },
      {
        id: "status",
        header: "Status",
        minWidth: 160,
        cell: (record) => <AttendanceStatusCell record={record} />,
      },
      {
        id: "is_confirmed",
        header: "Confirmed",
        cell: (record) =>
          record.is_confirmed ? (
            <Chip color="success" size="sm" variant="soft">
              Confirmed
            </Chip>
          ) : (
            "—"
          ),
      },
      {
        id: "marked_at",
        header: "Marked",
        allowsSorting: true,
        cell: (record) => formatDateTime(record.marked_at),
      },
    ],
    [athleteName],
  );

  return (
    <ListView resource="attendance" title="Attendance">
      <ResourceDataGrid<Attendance>
        ariaLabel="Attendance"
        columns={columns}
        contentClassName="min-w-[760px]"
        initialSorters={[{ field: "marked_at", order: "desc" }]}
        resource="attendance"
      />
    </ListView>
  );
}
