/**
 * @file event-rsvp.tsx
 * @module modules/sports/events/components/event-rsvp
 *
 * @description
 * Renders an event's RSVP list (its {@link "@/types".EventInvitation} rows) on
 * the detail screen: invited athlete + their response.
 */

import { Chip, Spinner } from "@stackra/ui/react";
import { useList } from "@refinedev/core";

import type { EventInvitation, RsvpStatus } from "@/types";
import type { ReactNode } from "react";

import { RSVP_STATUS_LABELS } from "@/types";

/** Maps each RSVP status to a semantic HeroUI Chip color. */
const RSVP_COLOR: Record<RsvpStatus, "success" | "warning" | "danger" | "default"> = {
  going: "success",
  not_going: "danger",
  maybe: "warning",
  pending: "default",
};

/**
 * Lists an event's invitations and their RSVP responses.
 *
 * @param props - The event id whose invitations to load.
 */
export function EventRsvp({ eventId }: { eventId: string }): ReactNode {
  const { result, query } = useList<EventInvitation>({
    resource: "event-invitations",
    pagination: { mode: "off" },
    filters: [{ field: "event_id", operator: "eq", value: eventId }],
  });

  const invitations = result?.data ?? [];

  if (query.isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner aria-label="Loading RSVPs" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return <p className="text-sm text-muted">No invitations yet.</p>;
  }

  return (
    <ul className="divide-y divide-separator rounded-lg border border-border">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">{invitation.athlete_id}</span>
          <Chip color={RSVP_COLOR[invitation.rsvp]} size="sm" variant="soft">
            {RSVP_STATUS_LABELS[invitation.rsvp]}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
