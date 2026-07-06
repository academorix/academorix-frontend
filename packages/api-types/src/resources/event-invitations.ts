/**
 * event-invitations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in event-invitations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, EventId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const EventInvitation = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    event_id: EventId,
    athlete_id: AthleteId,
    invited_user_id: UserId,
    rsvp: z.enum(["cancelled", "going", "maybe", "not_going"]),
    parent_response: z.enum(["cancelled", "no", "pending", "yes"]),
    responded_at: Timestamp.nullable(),
    cancellation_reason: z.string().nullable(),
    reminder_count: z.number(),
    last_reminder_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type EventInvitation = z.infer<typeof EventInvitation>;

export const { array: EventInvitationList, parse: parseEventInvitationsJson } =
  collectionHelpers(EventInvitation);
