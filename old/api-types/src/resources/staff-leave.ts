/**
 * staff-leave.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff-leave.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { StaffLeaveStatus } from "../enums.js";
import { StaffId, StaffLeaveId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StaffLeave = z
  .object({
    id: StaffLeaveId,
    tenant_id: TenantId,
    staff_id: StaffId,
    leave_type: z.enum(["annual", "bereavement", "parental", "sick", "unpaid"]),
    starts_on: z.enum([
      "2026-05-11",
      "2026-06-15",
      "2026-06-20",
      "2026-08-03",
      "2026-08-10",
      "2026-09-14",
    ]),
    ends_on: z.enum([
      "2026-05-15",
      "2026-06-16",
      "2026-08-14",
      "2026-08-24",
      "2026-09-20",
      "2026-09-25",
    ]),
    days: z.number(),
    status: StaffLeaveStatus,
    reason: z.string(),
    approved_by_user_id: UserId.nullable(),
    notes: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type StaffLeave = z.infer<typeof StaffLeave>;

export const { array: StaffLeaveList, parse: parseStaffLeaveJson } = collectionHelpers(StaffLeave);
