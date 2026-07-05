/**
 * payroll-lines.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in payroll-lines.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PayrollLineId, PayrollRunId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PayrollLine = z
  .object({
    id: PayrollLineId,
    tenant_id: TenantId,
    run_id: PayrollRunId,
    staff_id: StaffId,
    pay_type: z.enum(["hourly", "per_session", "salary"]),
    base_amount_minor: z.number(),
    sessions_delivered: z.number().nullable(),
    hours_worked: z.number().nullable(),
    bonus_minor: z.number(),
    deductions_minor: z.number(),
    gross_minor: z.number(),
    tax_minor: z.number(),
    net_minor: z.number(),
    currency: z.enum(["USD"]),
    notes: z.string(),
    created_at: Timestamp,
    branch_allocations: z.array(z.record(z.string(), z.unknown()).loose()).optional(),
  })
  .loose();
export type PayrollLine = z.infer<typeof PayrollLine>;

export const { array: PayrollLineList, parse: parsePayrollLinesJson } =
  collectionHelpers(PayrollLine);
