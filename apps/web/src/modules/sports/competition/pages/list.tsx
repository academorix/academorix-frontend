/**
 * @file list.tsx
 * @module modules/sports/competition/pages/list
 *
 * @description
 * Competitions list — the leagues, cups, and friendly series a tenant's teams
 * take part in. The standings table lives on the detail screen.
 */

import { Chip } from "@academorix/ui/react";
import { useMemo } from "react";

import type {
  Competition,
  CompetitionStatus,
} from "@/modules/sports/competition/competition.types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EditButton, ListView, ResourceDataGrid, ShowButton } from "@/components/refine";
import {
  COMPETITION_FORMAT_LABELS,
  COMPETITION_STATUS_LABELS,
} from "@/modules/sports/competition/competition.types";

/** Maps competition status to a semantic Chip color. */
const STATUS_COLOR: Record<CompetitionStatus, "success" | "warning" | "default"> = {
  upcoming: "warning",
  active: "success",
  completed: "default",
};

/** The competitions list page. */
export default function CompetitionList(): ReactNode {
  const columns = useMemo<DataGridColumn<Competition>[]>(
    () => [
      {
        id: "name",
        header: "Competition",
        isRowHeader: true,
        allowsSorting: true,
        minWidth: 220,
        cell: (competition) => <span className="font-medium">{competition.name}</span>,
      },
      { id: "sport_key", header: "Sport", cell: (competition) => competition.sport_key },
      {
        id: "format",
        header: "Format",
        allowsSorting: true,
        cell: (competition) => COMPETITION_FORMAT_LABELS[competition.format],
      },
      {
        id: "status",
        header: "Status",
        allowsSorting: true,
        cell: (competition) => (
          <Chip color={STATUS_COLOR[competition.status]} size="sm" variant="soft">
            {COMPETITION_STATUS_LABELS[competition.status]}
          </Chip>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "end",
        minWidth: 80,
        cell: (competition) => (
          <div className="flex justify-end gap-1">
            <ShowButton
              isIconOnly
              aria-label="View competition"
              recordItemId={competition.id}
              resource="competitions"
              size="sm"
              variant="ghost"
            />
            <EditButton
              isIconOnly
              aria-label="Edit competition"
              recordItemId={competition.id}
              resource="competitions"
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
    <ListView resource="competitions">
      <ResourceDataGrid<Competition>
        ariaLabel="Competitions"
        columns={columns}
        contentClassName="min-w-[640px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="competitions"
      />
    </ListView>
  );
}
