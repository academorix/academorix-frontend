/**
 * @file show.tsx
 * @module modules/sports/matches/pages/show
 *
 * @description
 * Match detail — a fixture card with status, sport, kick-off, venue, home/away,
 * and result.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Match } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { MatchStatusChip } from "@/modules/sports/matches/components/match-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The match detail page. */
export default function MatchShow(): ReactNode {
  const { result: match, query } = useShow<Match>({ resource: "matches" });

  if (query.isLoading || !match) {
    return (
      <ShowView resource="matches">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const score = match.score_for !== null ? `${match.score_for} - ${match.score_against}` : "—";

  return (
    <ShowView resource="matches">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>vs {match.opponent}</Card.Title>
            <Card.Description>{match.is_home ? "Home fixture" : "Away fixture"}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <MatchStatusChip status={match.status} />
              </Field>
              <Field label="Sport">{match.sport_key}</Field>
              <Field label="Kick-off">{formatDateTime(match.starts_at)}</Field>
              <Field label="Location">{match.location ?? "—"}</Field>
              <Field label="Home / Away">{match.is_home ? "Home" : "Away"}</Field>
              <Field label="Score">{score}</Field>
            </dl>
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
