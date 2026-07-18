/**
 * transactions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in transactions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { LedgerTransactionType } from "../enums.js";
import {
  ChargebackId,
  CreditMemoId,
  InvoiceId,
  LedgerTransactionId,
  PaymentId,
  RefundId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Transaction = z
  .object({
    id: LedgerTransactionId,
    tenant_id: TenantId,
    type: LedgerTransactionType,
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    parent_transaction_id: LedgerTransactionId.nullable(),
    invoice_id: InvoiceId.nullable(),
    payment_id: PaymentId.nullable(),
    refund_id: RefundId.nullable(),
    chargeback_id: ChargebackId.nullable(),
    credit_memo_id: CreditMemoId.nullable(),
    gateway: z.enum(["stripe"]).nullable(),
    gateway_ref: z.string().nullable(),
    occurred_at: Timestamp,
    metadata: z.record(z.string(), z.unknown()),
  })
  .loose();
export type Transaction = z.infer<typeof Transaction>;

export const { array: TransactionList, parse: parseTransactionsJson } =
  collectionHelpers(Transaction);
