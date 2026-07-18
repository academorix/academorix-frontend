/**
 * @file show.tsx
 * @module modules/sports/sessions/pages/show
 *
 * @description
 * Private session detail — a booking card with coach, athlete, sport, start,
 * duration, status, and price. Coach/athlete names are resolved from the `staff`
 * and `athletes` resources.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useList, useShow } from "@refinedev/core";
import { useMemo } from "react";

import type { Athlete, PrivateSession, Staff } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime, formatMoney } from "@/lib/format";
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

/** The private session detail page. */
export default function SessionShow(): ReactNode {
  const { result: session, query } = useShow<PrivateSession>({ resource: "private-sessions" });
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: athletesResult } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
  });

  const coachName = useMemo(() => {
    const map = new Map<string, string>();

    for (const member of staffResult?.data ?? []) {
      map.set(member.id, `${member.first_name} ${member.last_name}`);
    }

    return map;
  }, [staffResult?.data]);

  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  if (query.isLoading || !session) {
    return (
      <ShowView resource="private-sessions">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="private-sessions">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Private session</Card.Title>
            <Card.Description>{formatDateTime(session.starts_at)}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Coach">{coachName.get(session.coach_id) ?? session.coach_id}</Field>
              <Field label="Athlete">
                {athleteName.get(session.athlete_id) ?? session.athlete_id}
              </Field>
              <Field label="Sport">{session.sport_key}</Field>
              <Field label="Starts">{formatDateTime(session.starts_at)}</Field>
              <Field label="Duration">{session.duration_minutes}m</Field>
              <Field label="Status">
                <EventStatusChip status={session.status} />
              </Field>
              <Field label="Price">{formatMoney(session.price, session.currency ?? "USD")}</Field>
            </dl>
          </Card.Content>
        </Card>
      </div>
    </ShowView>
  );
}
