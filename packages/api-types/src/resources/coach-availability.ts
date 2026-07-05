/**
 * coach-availability.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in coach-availability.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { DayOfWeek } from "../enums.js";
import { CoachAvailabilityId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CoachAvailability = z
  .object({
    id: CoachAvailabilityId,
    tenant_id: TenantId,
    staff_id: StaffId,
    day_of_week: DayOfWeek,
    starts_at_time: z.enum(["09:00", "16:00", "18:00"]),
    ends_at_time: z.enum(["12:00", "13:00", "20:00", "21:00"]),
    recurrence: z.enum(["weekly"]),
    is_active: z.boolean(),
    sports: z.array(z.string()),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type CoachAvailability = z.infer<typeof CoachAvailability>;

export const { array: CoachAvailabilityList, parse: parseCoachAvailabilityJson } =
  collectionHelpers(CoachAvailability);
