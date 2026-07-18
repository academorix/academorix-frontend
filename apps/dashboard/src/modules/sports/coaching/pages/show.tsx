/**
 * @file show.tsx
 * @module modules/sports/coaching/pages/show
 *
 * @description
 * Coaching assignment detail — the coach, team, role, and season. Coach and team
 * names are resolved from their resources.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useOne, useShow } from "@refinedev/core";

import type { CoachAssignment } from "@/modules/sports/coaching/coaching.types";
import type { Staff, Team } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The coaching assignment detail page. */
export default function CoachingShow(): ReactNode {
  const { result: assignment, query } = useShow<CoachAssignment>({ resource: "coaches" });

  // Resolve related names once the assignment is known.
  const { result: staff } = useOne<Staff>({
    resource: "staff",
    id: assignment?.staff_id ?? "",
    queryOptions: { enabled: Boolean(assignment?.staff_id) },
  });
  const { result: team } = useOne<Team>({
    resource: "teams",
    id: assignment?.team_id ?? "",
    queryOptions: { enabled: Boolean(assignment?.team_id) },
  });

  return (
    <ShowView resource="coaches">
      {query.isLoading || !assignment ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>
              {staff ? `${staff.first_name} ${staff.last_name}` : assignment.staff_id}
            </Card.Title>
            <Card.Description>Coaching assignment</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Team">{team?.name ?? assignment.team_id}</Field>
              <Field label="Role">{assignment.role}</Field>
              <Field label="Season">{assignment.season_id ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
