/**
 * @file list.tsx
 * @module modules/sports/performance/pages/list
 *
 * @description
 * Performance/fitness-test results list — one row per recorded test battery, with
 * athlete, battery, sport, and date. Measured values are shown on the detail
 * screen via SDUI.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, PerformanceTest } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** The performance test results list page. */
export default function PerformanceList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<PerformanceTest>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Athlete",
        isRowHeader: true,
        minWidth: 200,
        cell: (test) => (
          <span className="font-medium">{athleteName.get(test.athlete_id) ?? test.athlete_id}</span>
        ),
      },
      { id: "battery", header: "Battery", allowsSorting: true, cell: (test) => test.battery },
      { id: "sport_key", header: "Sport", cell: (test) => test.sport_key },
      {
        id: "tested_at",
        header: "Tested",
        allowsSorting: true,
        cell: (test) => formatDate(test.tested_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 120,
        cell: (test) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View test"
              recordItemId={test.id}
              resource="performance"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit test"
              recordItemId={test.id}
              resource="performance"
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
    <ListView resource="performance">
      <ResourceDataGrid<PerformanceTest>
        ariaLabel="Performance tests"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "tested_at", order: "desc" }]}
        resource="performance"
      />
    </ListView>
  );
}
