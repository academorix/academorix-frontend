/**
 * payroll-runs.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in payroll-runs.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PayrollRunStatus } from "../enums.js";
import { OrganizationId, PayrollRunId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PayrollRun = z
  .object({
    id: PayrollRunId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    period_start: z.enum(["2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01"]),
    period_end: z.enum(["2026-04-30", "2026-05-31", "2026-06-30", "2026-07-31"]),
    status: PayrollRunStatus,
    currency: z.enum(["USD"]),
    total_gross_minor: z.number(),
    total_net_minor: z.number(),
    total_tax_minor: z.number(),
    staff_count: z.number(),
    approved_by_user_id: UserId.nullable(),
    paid_at: Timestamp.nullable(),
    payment_reference: z.enum(["BACS-2026-04-riverside", "BACS-2026-05-riverside"]).nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type PayrollRun = z.infer<typeof PayrollRun>;

export const { array: PayrollRunList, parse: parsePayrollRunsJson } = collectionHelpers(PayrollRun);
