/**
 * @file show.tsx
 * @module modules/sports/development/pages/show
 *
 * @description
 * Development-plan detail — the goal, its lifecycle status, target date, and any
 * coach note for a single athlete objective. The athlete name is resolved from
 * the athletes resource for a human-readable header.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { DevelopmentPlan } from "@/modules/sports/development/development.types";
import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { DevelopmentStatusChip } from "@/modules/sports/development/components/development-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The development-plan detail page. */
export default function DevelopmentShow(): ReactNode {
  const { result: plan, query } = useShow<DevelopmentPlan>({ resource: "development" });

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

  if (query.isLoading || !plan) {
    return (
      <ShowView resource="development">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  const resolvedAthlete = athleteName.get(plan.athlete_id) ?? plan.athlete_id;

  return (
    <ShowView resource="development">
      <Card>
        <Card.Header>
          <Card.Title>{plan.goal}</Card.Title>
          <Card.Description>{resolvedAthlete}</Card.Description>
        </Card.Header>
        <Card.Content>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Athlete">{resolvedAthlete}</Field>
            <Field label="Sport">{plan.sport_key}</Field>
            <Field label="Status">
              <DevelopmentStatusChip status={plan.status} />
            </Field>
            <Field label="Target date">{formatDate(plan.target_date)}</Field>
            <Field label="Note">{plan.note ?? "—"}</Field>
          </dl>
        </Card.Content>
      </Card>
    </ShowView>
  );
}
