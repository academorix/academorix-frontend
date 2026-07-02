/**
 * @file list.tsx
 * @module modules/sports/teams/pages/list
 *
 * @description
 * Teams list (scoped by the active branch + season), with sport, age group,
 * level, roster size, and status. Per-row show/edit/delete actions.
 */

import type { Team } from "@/types";
import type { DataGridColumn } from "@academorix/ui/react";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { SKILL_LEVEL_LABELS } from "@/types";

/** DataGrid columns for the teams list. */
const COLUMNS: DataGridColumn<Team>[] = [
  {
    id: "name",
    header: "Team",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 180,
    cell: (team) => <span className="font-medium">{team.name}</span>,
  },
  { id: "sport_key", header: "Sport", allowsSorting: true, cell: (team) => team.sport_key },
  { id: "age_group", header: "Age", cell: (team) => team.age_group },
  { id: "level", header: "Level", cell: (team) => SKILL_LEVEL_LABELS[team.level] },
  {
    id: "members_count",
    header: "Roster",
    cell: (team) => `${team.members_count}/${team.capacity}`,
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (team) => <EntityStatusChip status={team.status} />,
  },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (team) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View team"
          recordItemId={team.id}
          resource="teams"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit team"
          recordItemId={team.id}
          resource="teams"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete team"
          recordItemId={team.id}
          resource="teams"
          size="sm"
        />
      </div>
    ),
  },
];

/** The teams list page. */
export default function TeamList(): ReactNode {
  return (
    <ListView resource="teams">
      <ResourceDataGrid<Team>
        ariaLabel="Teams"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "name", order: "asc" }]}
        resource="teams"
      />
    </ListView>
  );
}
