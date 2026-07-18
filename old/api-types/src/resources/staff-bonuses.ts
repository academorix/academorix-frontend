/**
 * staff-bonuses.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff-bonuses.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { StaffBonusStatus } from "../enums.js";
import { StaffBonusId, StaffId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StaffBonuse = z
  .object({
    id: StaffBonusId,
    tenant_id: TenantId,
    staff_id: StaffId,
    bonus_type: z.enum(["referral", "retention", "sign_on", "win_bonus"]),
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    earned_period: z.enum([
      "2025-07/2026-06",
      "2026-01",
      "2026-03",
      "2026-05",
      "2026-06",
      "2026-Q2",
    ]),
    status: StaffBonusStatus,
    approved_by_user_id: UserId.nullable(),
    paid_at: Timestamp.nullable(),
    note: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type StaffBonuse = z.infer<typeof StaffBonuse>;

export const { array: StaffBonuseList, parse: parseStaffBonusesJson } =
  collectionHelpers(StaffBonuse);
