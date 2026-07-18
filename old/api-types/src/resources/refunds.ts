/**
 * refunds.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in refunds.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PaymentMethod, RefundStatus } from "../enums.js";
import {
  ApprovalTaskId,
  InvoiceId,
  LedgerTransactionId,
  PaymentId,
  PaymentMethodId,
  RefundId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Refund = z
  .object({
    id: RefundId,
    tenant_id: TenantId,
    payment_id: PaymentId,
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    reason: z.string(),
    method: PaymentMethod,
    gateway_refund_id: z.string().nullable(),
    status: RefundStatus,
    created_by_user_id: UserId,
    approval_task_id: ApprovalTaskId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    gateway: z.enum(["stripe"]).optional(),
    parent_transaction_id: LedgerTransactionId.optional(),
    notes: z.string().optional(),
    failure_code: z.string().optional(),
    failure_reason: z.string().optional(),
    invoice_id: InvoiceId.optional(),
    payment_method_id: PaymentMethodId.optional(),
    canceled_by_user_id: UserId.optional(),
    canceled_at: Timestamp.optional(),
    cancel_reason: z.string().optional(),
  })
  .loose();
export type Refund = z.infer<typeof Refund>;

export const { array: RefundList, parse: parseRefundsJson } = collectionHelpers(Refund);
