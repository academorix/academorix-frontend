/**
 * credit-memos.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in credit-memos.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CreditMemoStatus } from "../enums.js";
import { CreditMemoId, InvoiceId, LedgerTransactionId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CreditMemo = z
  .object({
    id: CreditMemoId,
    tenant_id: TenantId,
    payer_user_id: UserId,
    currency: z.enum(["USD"]),
    amount_minor: z.number(),
    remaining_minor: z.number(),
    reason: z.string(),
    source_invoice_id: InvoiceId.nullable(),
    status: CreditMemoStatus,
    issued_by_user_id: UserId,
    created_at: Timestamp,
    updated_at: Timestamp,
    issued_at: Timestamp.optional(),
    expires_at: Timestamp.optional(),
    expired_at: Timestamp.optional(),
    voided_by_user_id: UserId.optional(),
    void_reason: z.string().optional(),
    voided_at: Timestamp.optional(),
    last_applied_invoice_id: InvoiceId.optional(),
    last_applied_transaction_id: LedgerTransactionId.optional(),
    last_applied_amount_minor: z.number().optional(),
    last_applied_at: Timestamp.optional(),
    applied_history: z.array(z.record(z.string(), z.unknown()).loose()).optional(),
  })
  .loose();
export type CreditMemo = z.infer<typeof CreditMemo>;

export const { array: CreditMemoList, parse: parseCreditMemosJson } = collectionHelpers(CreditMemo);
