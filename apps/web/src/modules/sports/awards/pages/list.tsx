/**
 * @file list.tsx
 * @module modules/sports/awards/pages/list
 *
 * @description
 * Awards list — certificates and recognitions granted to athletes, with the
 * recipient (resolved), award title, type, and grant date.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, Award } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** The awards list page. */
export default function AwardsList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<Award>[]>(
    () => [
      {
        id: "title",
        header: "Award",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 220,
        cell: (award) => <span className="font-medium">{award.title}</span>,
      },
      {
        id: "athlete_id",
        header: "Athlete",
        minWidth: 180,
        cell: (award) => athleteName.get(award.athlete_id) ?? award.athlete_id,
      },
      { id: "type", header: "Type", allowsSorting: true, cell: (award) => award.type },
      {
        id: "granted_at",
        header: "Granted",
        allowsSorting: true,
        cell: (award) => formatDate(award.granted_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (award) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View award"
              recordItemId={award.id}
              resource="awards"
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
    <ListView resource="awards">
      <ResourceDataGrid<Award>
        ariaLabel="Awards"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "granted_at", order: "desc" }]}
        resource="awards"
      />
    </ListView>
  );
}
