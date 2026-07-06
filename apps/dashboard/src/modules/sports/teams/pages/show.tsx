/**
 * @file show.tsx
 * @module modules/sports/teams/pages/show
 *
 * @description
 * Team detail — identity/config card plus the roster (its members).
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Team } from "@/types";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import { ShowView } from "@/components/refine";
import { TeamRoster } from "@/modules/sports/teams/components/team-roster";
import { SKILL_LEVEL_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The team detail page. */
export default function TeamShow(): ReactNode {
  const { result: team, query } = useShow<Team>({ resource: "teams" });

  if (query.isLoading || !team) {
    return (
      <ShowView resource="teams">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="teams">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{team.name}</Card.Title>
            <Card.Description>
              {team.sport_key} · {team.age_group}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EntityStatusChip status={team.status} />
              </Field>
              <Field label="Level">{SKILL_LEVEL_LABELS[team.level]}</Field>
              <Field label="Roster">
                {team.members_count}/{team.capacity}
              </Field>
              <Field label="Description">{team.description ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Roster</h2>
          <TeamRoster teamId={team.id} />
        </section>
      </div>
    </ShowView>
  );
}
