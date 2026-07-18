/**
 * event-reminders.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in event-reminders.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { EventReminderStatus } from "../enums.js";
import { EventId, EventReminderId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const EventReminder = z
  .object({
    id: EventReminderId,
    tenant_id: TenantId,
    event_id: EventId,
    offset_minutes: z.number(),
    channels: z.array(z.string()),
    target_audience: z.enum(["confirmed_only", "guardians", "invited_all", "pending_only"]),
    status: EventReminderStatus,
    scheduled_at: Timestamp,
    sent_at: Timestamp.nullable(),
    throttle_key: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type EventReminder = z.infer<typeof EventReminder>;

export const { array: EventReminderList, parse: parseEventRemindersJson } =
  collectionHelpers(EventReminder);
