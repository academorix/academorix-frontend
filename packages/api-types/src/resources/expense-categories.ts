/**
 * expense-categories.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in expense-categories.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ExpenseCategoryId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ExpenseCategorie = z
  .object({
    id: ExpenseCategoryId,
    tenant_id: TenantId,
    key: z.enum(["equipment", "maintenance", "marketing", "rent", "salaries", "utilities"]),
    name: z.string(),
    description: z.string(),
    is_recurring_default: z.boolean(),
    sort_order: z.number(),
    is_active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ExpenseCategorie = z.infer<typeof ExpenseCategorie>;

export const { array: ExpenseCategorieList, parse: parseExpenseCategoriesJson } =
  collectionHelpers(ExpenseCategorie);
