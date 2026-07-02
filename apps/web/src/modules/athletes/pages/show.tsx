/**
 * @file show.tsx
 * @module modules/athletes/pages/show
 *
 * @description
 * Athlete detail screen (the resource's `show` route). Refine's `useShow`
 * fetches the record; {@link ShowView} supplies the header + record actions
 * (edit/clone/delete/refresh/list). The body renders the athlete's fields as a
 * labelled description grid.
 */

import { Card, Chip, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { Athlete, EntityStatus } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { ENTITY_STATUS_LABELS, SKILL_LEVEL_LABELS } from "@/types";

/** Maps an athlete status to a HeroUI Chip color. */
const STATUS_COLOR: Record<EntityStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  pending: "warning",
  archived: "danger",
  inactive: "default",
};

/** Formats an ISO date/timestamp as a short, locale-aware date. */
function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

/** A single labelled field in the detail grid. */
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

  return (
    <ShowView resource="athletes">
      {query.isLoading || !athlete ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
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
                <Chip color={STATUS_COLOR[athlete.status]} size="sm" variant="soft">
                  {ENTITY_STATUS_LABELS[athlete.status]}
                </Chip>
              </Field>
              <Field label="Level">{athlete.level ? SKILL_LEVEL_LABELS[athlete.level] : "—"}</Field>
              <Field label="Gender">{athlete.gender ?? "—"}</Field>
              <Field label="Phone">{athlete.phone ?? "—"}</Field>
              <Field label="Date of birth">{formatDate(athlete.date_of_birth)}</Field>
              <Field label="Enrolled">{formatDate(athlete.enrolled_at)}</Field>
              <Field label="Branch">{athlete.branch_id}</Field>
              <Field label="Team">{athlete.team_id ?? "—"}</Field>
              <Field label="Updated">{formatDate(athlete.updated_at)}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
