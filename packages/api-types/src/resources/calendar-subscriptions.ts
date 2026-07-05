/**
 * calendar-subscriptions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in calendar-subscriptions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, CalendarSubscriptionId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CalendarSubscription = z
  .object({
    id: CalendarSubscriptionId,
    tenant_id: TenantId,
    user_id: UserId,
    athlete_id: AthleteId.nullable(),
    feed_url: z.string(),
    token: z.string(),
    scope: z.enum(["all_athletes", "branch", "single_athlete", "team"]),
    active: z.boolean(),
    last_polled_at: Timestamp.nullable(),
    poll_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type CalendarSubscription = z.infer<typeof CalendarSubscription>;

export const { array: CalendarSubscriptionList, parse: parseCalendarSubscriptionsJson } =
  collectionHelpers(CalendarSubscription);
