/**
 * payments.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in payments.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PaymentMethod, PaymentStatus } from "../enums.js";
import { InvoiceId, PaymentId, PaymentMethodId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Payment = z
  .object({
    id: PaymentId,
    tenant_id: TenantId,
    invoice_id: InvoiceId,
    payer_user_id: UserId,
    status: PaymentStatus,
    currency: z.enum(["USD"]),
    amount_minor: z.number(),
    refunded_minor: z.number(),
    method: PaymentMethod,
    payment_method_id: PaymentMethodId.nullable(),
    gateway: z.enum(["stripe"]).nullable(),
    gateway_customer_id: z.string().nullable(),
    gateway_payment_intent_id: z.string().nullable(),
    gateway_charge_id: z.string().nullable(),
    failure_reason: z.unknown().nullable(),
    idempotency_key: z.string(),
    taken_by_user_id: UserId.nullable(),
    paid_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type Payment = z.infer<typeof Payment>;

export const { array: PaymentList, parse: parsePaymentsJson } = collectionHelpers(Payment);
