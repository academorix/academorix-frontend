/**
 * @file list.tsx
 * @module modules/sports/matches/pages/list
 *
 * @description
 * Matches list (scoped by branch + season) — fixtures with opponent, sport,
 * kick-off, status, and result. Per-row show/edit/delete actions.
 */

import type { Match } from "@/types";
import type { DataGridColumn } from "@stackra/ui/react";
import type { ReactNode } from "react";

import {
  DeleteButton,
  EditButton,
  ListView,
  ResourceDataGrid,
  ShowButton,
} from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { MatchStatusChip } from "@/modules/sports/matches/components/match-status-chip";

/** Renders a match's result, or an em dash before it's recorded. */
function formatScore(match: Match): string {
  return match.score_for !== null ? `${match.score_for}-${match.score_against}` : "—";
}

/** DataGrid columns for the matches list. */
const COLUMNS: DataGridColumn<Match>[] = [
  {
    id: "opponent",
    header: "Opponent",
    isRowHeader: true,
    allowsSorting: true,
    minWidth: 200,
    cell: (match) => (
      <div className="flex flex-col">
        <span className="font-medium">vs {match.opponent}</span>
        <span className="text-xs text-muted">{match.is_home ? "Home" : "Away"}</span>
      </div>
    ),
  },
  { id: "sport_key", header: "Sport", cell: (match) => match.sport_key },
  {
    id: "starts_at",
    header: "Kick-off",
    allowsSorting: true,
    minWidth: 170,
    cell: (match) => formatDateTime(match.starts_at),
  },
  {
    id: "status",
    header: "Status",
    allowsSorting: true,
    cell: (match) => <MatchStatusChip status={match.status} />,
  },
  { id: "score", header: "Score", cell: (match) => formatScore(match) },
  {
    id: "actions",
    header: "",
    align: "end",
    minWidth: 150,
    cell: (match) => (
      <div className="flex justify-end gap-1">
        <ShowButton
          isIconOnly
          aria-label="View match"
          recordItemId={match.id}
          resource="matches"
          size="sm"
          variant="ghost"
        />
        <EditButton
          isIconOnly
          aria-label="Edit match"
          recordItemId={match.id}
          resource="matches"
          size="sm"
          variant="ghost"
        />
        <DeleteButton
          isIconOnly
          aria-label="Delete match"
          recordItemId={match.id}
          resource="matches"
          size="sm"
        />
      </div>
    ),
  },
];

/** The matches list page. */
export default function MatchList(): ReactNode {
  return (
    <ListView resource="matches">
      <ResourceDataGrid<Match>
        ariaLabel="Matches"
        columns={COLUMNS}
        contentClassName="min-w-[820px]"
        initialSorters={[{ field: "starts_at", order: "desc" }]}
        resource="matches"
      />
    </ListView>
  );
}
