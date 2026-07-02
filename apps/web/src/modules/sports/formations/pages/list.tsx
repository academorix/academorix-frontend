/**
 * @file list.tsx
 * @module modules/sports/formations/pages/list
 *
 * @description
 * Formations list — reusable tactical shapes (name + shorthand shape) a coach
 * can open to view the positioned player layout on the pitch.
 */

import { useMemo } from "react";

import type { Formation } from "@/modules/sports/formations/formation.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";

/** The formations list page. */
export default function FormationsList(): ReactNode {
  const columns = useMemo<DataGridColumn<Formation>[]>(
    () => [
      {
        id: "name",
        header: "Formation",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 220,
        cell: (formation) => <span className="font-medium">{formation.name}</span>,
      },
      { id: "shape", header: "Shape", allowsSorting: true, cell: (formation) => formation.shape },
      { id: "sport_key", header: "Sport", cell: (formation) => formation.sport_key },
      {
        id: "slots",
        header: "Players",
        cell: (formation) => formation.slots.length,
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (formation) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View formation"
              recordItemId={formation.id}
              resource="formations"
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
    <ListView resource="formations">
      <ResourceDataGrid<Formation>
        ariaLabel="Formations"
        columns={columns}
        contentClassName="min-w-[560px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="formations"
      />
    </ListView>
  );
}
