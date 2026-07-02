/**
 * @file list.tsx
 * @module modules/sports/drills/pages/list
 *
 * @description
 * Drill-library list — reusable curriculum drills tagged by sport, skill level,
 * and the skills they develop. Coaches compose training sessions from these.
 */

import { useMemo } from "react";

import type { Drill } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { SKILL_LEVEL_LABELS } from "@/types";

/** The drill-library list page. */
export default function DrillsList(): ReactNode {
  const columns = useMemo<DataGridColumn<Drill>[]>(
    () => [
      {
        id: "name",
        header: "Drill",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 220,
        cell: (drill) => <span className="font-medium">{drill.name}</span>,
      },
      { id: "sport_key", header: "Sport", cell: (drill) => drill.sport_key },
      {
        id: "level",
        header: "Level",
        allowsSorting: true,
        cell: (drill) => SKILL_LEVEL_LABELS[drill.level],
      },
      {
        id: "duration_minutes",
        header: "Duration",
        allowsSorting: true,
        cell: (drill) => `${drill.duration_minutes} min`,
      },
      {
        id: "tags",
        header: "Develops",
        minWidth: 200,
        cell: (drill) => (drill.tags.length > 0 ? drill.tags.join(", ") : "—"),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (drill) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View drill"
              recordItemId={drill.id}
              resource="drills"
              size="sm"
              variant="ghost"
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <ListView resource="drills">
      <ResourceDataGrid<Drill>
        ariaLabel="Drill library"
        columns={columns}
        contentClassName="min-w-[720px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="drills"
      />
    </ListView>
  );
}
