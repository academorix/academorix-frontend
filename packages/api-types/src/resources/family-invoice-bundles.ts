/**
 * family-invoice-bundles.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in family-invoice-bundles.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { DocumentId, FamilyInvoiceBundleId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const FamilyInvoiceBundle = z
  .object({
    id: FamilyInvoiceBundleId,
    tenant_id: TenantId,
    payer_user_id: UserId,
    period_start: z.enum(["2026-06-01", "2026-07-01"]),
    period_end: z.enum(["2026-06-30", "2026-07-31"]),
    member_invoice_ids: z.array(z.string()),
    subtotal_minor: z.number(),
    tax_minor: z.number(),
    total_minor: z.number(),
    currency: z.enum(["USD"]),
    pdf_document_id: DocumentId.nullable(),
    generated_at: Timestamp.nullable(),
    is_opt_in: z.boolean(),
    status: z.enum(["pending", "rendered"]),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type FamilyInvoiceBundle = z.infer<typeof FamilyInvoiceBundle>;

export const { array: FamilyInvoiceBundleList, parse: parseFamilyInvoiceBundlesJson } =
  collectionHelpers(FamilyInvoiceBundle);
