/**
 * @file list.tsx
 * @module modules/sports/development/pages/list
 *
 * @description
 * Development-plans list — one row per athlete goal, with athlete, goal, sport,
 * status, and target date. Coaches use this to track individual development
 * objectives (IDPs) across the roster.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { DevelopmentPlan } from "@/modules/sports/development/development.types";
import type { Athlete } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { DevelopmentStatusChip } from "@/modules/sports/development/components/development-status-chip";

/** The development-plans list page. */
export default function DevelopmentList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<DevelopmentPlan>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Athlete",
        isRowHeader: true,
        minWidth: 200,
        cell: (plan) => (
          <span className="font-medium">{athleteName.get(plan.athlete_id) ?? plan.athlete_id}</span>
        ),
      },
      {
        id: "goal",
        header: "Goal",
        allowsSorting: true,
        minWidth: 260,
        cell: (plan) => plan.goal,
      },
      { id: "sport_key", header: "Sport", cell: (plan) => plan.sport_key },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (plan) => <DevelopmentStatusChip status={plan.status} />,
      },
      {
        id: "target_date",
        header: "Target",
        allowsSorting: true,
        cell: (plan) => formatDate(plan.target_date),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (plan) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View plan"
              recordItemId={plan.id}
              resource="development"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit plan"
              recordItemId={plan.id}
              resource="development"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [athleteName],
  );

  return (
    <ListView resource="development">
      <ResourceDataGrid<DevelopmentPlan>
        ariaLabel="Development plans"
        columns={columns}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "target_date", order: "asc" }]}
        resource="development"
      />
    </ListView>
  );
}
