/**
 * @file list.tsx
 * @module modules/sports/progress/pages/list
 *
 * @description
 * Progress/skill-card assessments list — one row per recorded assessment, with
 * athlete, sport, level, and date. The sport-variable card values are shown on
 * the detail screen via SDUI.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, Progress } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { SKILL_LEVEL_LABELS } from "@/types";

/** The progress assessments list page. */
export default function ProgressList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<Progress>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Athlete",
        isRowHeader: true,
        minWidth: 200,
        cell: (progress) => (
          <span className="font-medium">
            {athleteName.get(progress.athlete_id) ?? progress.athlete_id}
          </span>
        ),
      },
      { id: "sport_key", header: "Sport", cell: (progress) => progress.sport_key },
      {
        id: "level",
        header: "Level",
        cell: (progress) => (progress.level ? SKILL_LEVEL_LABELS[progress.level] : "—"),
      },
      {
        id: "assessed_at",
        header: "Assessed",
        allowsSorting: true,
        cell: (progress) => formatDate(progress.assessed_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (progress) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View assessment"
              recordItemId={progress.id}
              resource="progress"
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
    <ListView resource="progress">
      <ResourceDataGrid<Progress>
        ariaLabel="Progress assessments"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "assessed_at", order: "desc" }]}
        resource="progress"
      />
    </ListView>
  );
}
