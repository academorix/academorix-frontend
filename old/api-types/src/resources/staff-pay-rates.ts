/**
 * staff-pay-rates.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff-pay-rates.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StaffPayRate = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    staff_id: StaffId,
    rate_type: z.enum(["hourly", "monthly_salary", "per_session"]),
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    effective_from: z.enum(["2024-08-15", "2025-01-10", "2025-11-25", "2026-06-01"]),
    effective_to: z.unknown().nullable(),
    is_active: z.boolean(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type StaffPayRate = z.infer<typeof StaffPayRate>;

export const { array: StaffPayRateList, parse: parseStaffPayRatesJson } =
  collectionHelpers(StaffPayRate);
