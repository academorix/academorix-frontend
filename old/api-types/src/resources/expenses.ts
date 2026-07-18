/**
 * expenses.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in expenses.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ExpenseStatus } from "../enums.js";
import {
  BranchId,
  DocumentId,
  ExpenseCategoryId,
  ExpenseId,
  OrganizationId,
  RegionId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Expense = z
  .object({
    id: ExpenseId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    region_id: RegionId,
    category_id: ExpenseCategoryId,
    category_key: z.enum(["equipment", "maintenance", "marketing", "rent", "utilities"]),
    amount_minor: z.number(),
    currency: z.enum(["USD"]),
    status: ExpenseStatus,
    description: z.string(),
    vendor: z.string(),
    is_recurring: z.boolean(),
    recurrence: z.record(z.string(), z.unknown()).nullable(),
    receipt_document_id: DocumentId.nullable(),
    incurred_at: Timestamp,
    paid_at: Timestamp.nullable(),
    created_by_user_id: UserId,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Expense = z.infer<typeof Expense>;

export const { array: ExpenseList, parse: parseExpensesJson } = collectionHelpers(Expense);
