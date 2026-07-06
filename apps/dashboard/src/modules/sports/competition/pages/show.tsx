/**
 * @file show.tsx
 * @module modules/sports/competition/pages/show
 *
 * @description
 * Competition detail — metadata plus the **standings table** (one row per team,
 * ordered by rank). Standings are loaded from the `competition-standings`
 * resource filtered by this competition's id; goal difference is derived here.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useList, useShow } from "@refinedev/core";

import type {
  Competition,
  CompetitionStanding,
} from "@/modules/sports/competition/competition.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import {
  COMPETITION_FORMAT_LABELS,
  COMPETITION_STATUS_LABELS,
} from "@/modules/sports/competition/competition.types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** Column headers for the standings table (short stat codes). */
const STAT_COLUMNS: { key: string; label: string; title: string }[] = [
  { key: "played", label: "P", title: "Played" },
  { key: "won", label: "W", title: "Won" },
  { key: "drawn", label: "D", title: "Drawn" },
  { key: "lost", label: "L", title: "Lost" },
  { key: "goals_for", label: "GF", title: "Goals for" },
  { key: "goals_against", label: "GA", title: "Goals against" },
  { key: "goal_difference", label: "GD", title: "Goal difference" },
  { key: "points", label: "Pts", title: "Points" },
];

/** The competition detail + standings page. */
export default function CompetitionShow(): ReactNode {
  const { result: competition, query } = useShow<Competition>({ resource: "competitions" });

  const { result: standingsResult } = useList<CompetitionStanding>({
    resource: "competition-standings",
    filters: [{ field: "competition_id", operator: "eq", value: competition?.id }],
    sorters: [{ field: "rank", order: "asc" }],
    pagination: { mode: "off" },
    queryOptions: { enabled: Boolean(competition?.id) },
  });

  if (query.isLoading || !competition) {
    return (
      <ShowView resource="competitions">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const standings = standingsResult?.data ?? [];

  return (
    <ShowView resource="competitions">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{competition.name}</Card.Title>
            <Card.Description>{COMPETITION_STATUS_LABELS[competition.status]}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Sport">{competition.sport_key}</Field>
              <Field label="Format">{COMPETITION_FORMAT_LABELS[competition.format]}</Field>
              <Field label="Status">{COMPETITION_STATUS_LABELS[competition.status]}</Field>
            </dl>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Standings</Card.Title>
          </Card.Header>
          <Card.Content>
            {standings.length === 0 ? (
              <p className="text-sm text-muted">No standings recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-default text-left text-muted">
                      <th className="py-2 pr-2 font-medium" scope="col">
                        #
                      </th>
                      <th className="py-2 pr-4 font-medium" scope="col">
                        Team
                      </th>
                      {STAT_COLUMNS.map((column) => (
                        <th
                          key={column.key}
                          className="px-2 py-2 text-right font-medium"
                          scope="col"
                          title={column.title}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.id} className="border-b border-default/60 last:border-0">
                        <td className="py-2 pr-2 text-muted">{row.rank}</td>
                        <th className="py-2 pr-4 text-left font-medium text-foreground" scope="row">
                          {row.team_name}
                        </th>
                        <td className="px-2 py-2 text-right">{row.played}</td>
                        <td className="px-2 py-2 text-right">{row.won}</td>
                        <td className="px-2 py-2 text-right">{row.drawn}</td>
                        <td className="px-2 py-2 text-right">{row.lost}</td>
                        <td className="px-2 py-2 text-right">{row.goals_for}</td>
                        <td className="px-2 py-2 text-right">{row.goals_against}</td>
                        <td className="px-2 py-2 text-right">
                          {row.goals_for - row.goals_against}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-foreground">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
