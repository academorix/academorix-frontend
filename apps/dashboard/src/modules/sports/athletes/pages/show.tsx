/**
 * @file show.tsx
 * @module modules/sports/athletes/pages/show
 *
 * @description
 * Athlete detail — typed identity in a card, plus the athlete's per-sport
 * enrollments rendered via SDUI (see {@link AthleteEnrollments}).
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { EntityStatusChip } from "@/components/entity-status-chip";
import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";
import { AthleteEnrollments } from "@/modules/sports/athletes/components/athlete-enrollments";
import { GENDER_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The athlete detail page. */
export default function AthleteShow(): ReactNode {
  const { result: athlete, query } = useShow<Athlete>({ resource: "athletes" });

  if (query.isLoading || !athlete) {
    return (
      <ShowView resource="athletes">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="athletes">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>
              {athlete.first_name} {athlete.last_name}
            </Card.Title>
            <Card.Description>{athlete.email}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EntityStatusChip status={athlete.status} />
              </Field>
              <Field label="Gender">{athlete.gender ? GENDER_LABELS[athlete.gender] : "—"}</Field>
              <Field label="Nationality">{athlete.nationality ?? "—"}</Field>
              <Field label="Phone">{athlete.phone ?? "—"}</Field>
              <Field label="Date of birth">{formatDate(athlete.date_of_birth)}</Field>
              <Field label="Enrolled">{formatDate(athlete.enrolled_at)}</Field>
              <Field label="Branch">{athlete.branch_id}</Field>
              <Field label="National ID">{athlete.national_id ?? "—"}</Field>
              <Field label="Updated">{formatDate(athlete.updated_at)}</Field>
            </dl>
          </Card.Content>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Enrollments</h2>
          <AthleteEnrollments athleteId={athlete.id} />
        </section>
      </div>
    </ShowView>
  );
}
