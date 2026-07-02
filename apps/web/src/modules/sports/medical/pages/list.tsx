/**
 * @file list.tsx
 * @module modules/sports/medical/pages/list
 *
 * @description
 * Medical records list — clearance/injury/allergy records per athlete with a
 * clearance status. **Sensitive data**: this resource is gated behind the
 * `medical` permission; only authorized staff see it.
 */

import { Chip } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, MedicalRecord } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** The medical records list page. */
export default function MedicalList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<MedicalRecord>[]>(
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
      { id: "type", header: "Type", allowsSorting: true, cell: (record) => record.type },
      {
        id: "is_cleared",
        header: "Clearance",
        cell: (record) =>
          record.is_cleared ? (
            <Chip color="success" size="sm" variant="soft">
              Cleared
            </Chip>
          ) : (
            <Chip color="danger" size="sm" variant="soft">
              Not cleared
            </Chip>
          ),
      },
      {
        id: "cleared_until",
        header: "Cleared until",
        cell: (record) => formatDate(record.cleared_until),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (record) => (
          <div className="flex justify-end">
            <ShowButton
              isIconOnly
              aria-label="View record"
              recordItemId={record.id}
              resource="medical"
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
    <ListView resource="medical">
      <ResourceDataGrid<MedicalRecord>
        ariaLabel="Medical records"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "recorded_at", order: "desc" }]}
        resource="medical"
      />
    </ListView>
  );
}
