/**
 * @file list.tsx
 * @module modules/safeguarding/pages/list
 *
 * @description
 * Safeguarding cases list — welfare concerns with subject, category, severity,
 * status, and open date. **Sensitive**: gated behind the `safeguarding`
 * permission; only designated leads/admins reach this surface.
 */

import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";
import type { Athlete } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import { formatDate } from "@/lib/format";
import {
  SafeguardingSeverityChip,
  SafeguardingStatusChip,
} from "@/modules/safeguarding/components/safeguarding-chips";

/** The safeguarding cases list page. */
export default function SafeguardingList(): ReactNode {
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

  const columns = useMemo<DataGridColumn<SafeguardingCase>[]>(
    () => [
      {
        id: "athlete_id",
        header: "Subject",
        isRowHeader: true,
        minWidth: 180,
        cell: (record) => (
          <span className="font-medium">
            {record.athlete_id
              ? (athleteName.get(record.athlete_id) ?? record.athlete_id)
              : "General"}
          </span>
        ),
      },
      {
        id: "category",
        header: "Category",
        allowsSorting: true,
        cell: (record) => record.category,
      },
      {
        id: "severity",
        header: "Severity",
        allowsSorting: true,
        cell: (record) => <SafeguardingSeverityChip severity={record.severity} />,
      },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (record) => <SafeguardingStatusChip status={record.status} />,
      },
      {
        id: "opened_at",
        header: "Opened",
        allowsSorting: true,
        cell: (record) => formatDate(record.opened_at),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 120,
        cell: (record) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View case"
              recordItemId={record.id}
              resource="safeguarding"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit case"
              recordItemId={record.id}
              resource="safeguarding"
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
    <ListView resource="safeguarding">
      <ResourceDataGrid<SafeguardingCase>
        ariaLabel="Safeguarding cases"
        columns={columns}
        contentClassName="min-w-[680px]"
        initialSorters={[{ field: "opened_at", order: "desc" }]}
        resource="safeguarding"
      />
    </ListView>
  );
}
