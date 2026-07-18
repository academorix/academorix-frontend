/**
 * chargebacks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in chargebacks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ChargebackStatus } from "../enums.js";
import { ChargebackId, DevelopmentPathwayId, PaymentId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Chargeback = z
  .object({
    id: ChargebackId,
    tenant_id: TenantId,
    payment_id: PaymentId,
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    reason_code: z.enum([
      "credit_not_processed",
      "duplicate",
      "fraudulent",
      "product_not_received",
      "subscription_canceled",
    ]),
    gateway: z.enum(["stripe"]),
    gateway_dispute_id: DevelopmentPathwayId,
    status: ChargebackStatus,
    outcome: z.enum(["awaiting_bank_decision", "lost", "needs_response", "reversed", "won"]),
    opened_at: Timestamp,
    resolved_at: Timestamp.nullable(),
    evidence_submitted_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    response_due_at: Timestamp.optional(),
    assigned_to_user_id: UserId.optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Chargeback = z.infer<typeof Chargeback>;

export const { array: ChargebackList, parse: parseChargebacksJson } = collectionHelpers(Chargeback);
