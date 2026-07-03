/**
 * @file show.tsx
 * @module modules/sports/training/pages/show
 *
 * @description
 * Training session detail — title, schedule, coach, focus, and status.
 */

import { Card, Spinner } from "@academorix/ui/react";
import { useShow } from "@refinedev/core";

import type { TrainingSession } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { EventStatusChip } from "@/modules/sports/events/components/event-status-chip";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The training session detail page. */
export default function TrainingShow(): ReactNode {
  const { result: session, query } = useShow<TrainingSession>({ resource: "training-sessions" });

  return (
    <ShowView resource="training-sessions">
      {query.isLoading || !session ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{session.title}</Card.Title>
            <Card.Description>Training session</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EventStatusChip status={session.status} />
              </Field>
              <Field label="Starts">{formatDateTime(session.starts_at)}</Field>
              <Field label="Duration">{session.duration_minutes}m</Field>
              <Field label="Coach">{session.coach_id ?? "—"}</Field>
              <Field label="Focus">{session.focus ?? "—"}</Field>
            </dl>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
