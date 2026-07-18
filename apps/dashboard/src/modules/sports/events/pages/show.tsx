/**
 * @file show.tsx
 * @module modules/sports/events/pages/show
 *
 * @description
 * Event detail — schedule/location card plus the RSVP list.
 */

import { Card, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Event } from "@/types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDateTime } from "@/lib/format";
import { EventRsvp } from "@/modules/sports/events/components/event-rsvp";
import { EventStatusChip } from "@/modules/sports/events/components/event-status-chip";
import { EVENT_TYPE_LABELS } from "@/types";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The event detail page. */
export default function EventShow(): ReactNode {
  const { result: event, query } = useShow<Event>({ resource: "events" });

  if (query.isLoading || !event) {
    return (
      <ShowView resource="events">
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      </ShowView>
    );
  }

  return (
    <ShowView resource="events">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>{event.title}</Card.Title>
            <Card.Description>{EVENT_TYPE_LABELS[event.type]}</Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Status">
                <EventStatusChip status={event.status} />
              </Field>
              <Field label="Starts">{formatDateTime(event.starts_at)}</Field>
              <Field label="Ends">{formatDateTime(event.ends_at)}</Field>
              <Field label="Location">{event.location ?? "—"}</Field>
              <Field label="RSVP">
                {event.rsvp_going}/{event.rsvp_total} going
              </Field>
            </dl>
          </Card.Content>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Invitations</h2>
          <EventRsvp eventId={event.id} />
        </section>
      </div>
    </ShowView>
  );
}
