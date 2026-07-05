/**
 * invoices.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in invoices.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { InvoiceSourceType, InvoiceStatus } from "../enums.js";
import {
  AthleteId,
  BranchId,
  InvoiceId,
  OrganizationId,
  RegionId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Invoice = z
  .object({
    id: InvoiceId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    region_id: RegionId,
    payer_user_id: UserId,
    athlete_id: AthleteId,
    source_type: InvoiceSourceType,
    source_id: z.string().nullable(),
    number: z.enum([
      "INV-1001",
      "INV-1002",
      "INV-1003",
      "INV-1004",
      "INV-1005",
      "INV-1006",
      "INV-1007-POST",
      "INV-1007-PRE",
      "INV-PS-EMMA-1",
      "INV-PS-LIAM-1",
      "INV-PS-NOAH-1",
    ]),
    status: InvoiceStatus,
    currency: z.enum(["USD"]),
    subtotal_minor: z.number(),
    tax_minor: z.number(),
    total_minor: z.number(),
    paid_minor: z.number(),
    credited_minor: z.number(),
    lines: z.array(z.record(z.string(), z.unknown()).loose()),
    due_at: Timestamp,
    issued_at: Timestamp,
    voided_at: z.unknown().nullable(),
    void_reason: z.unknown().nullable(),
    pdf_document_id: z.unknown().nullable(),
    version: z.number(),
    metadata: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type Invoice = z.infer<typeof Invoice>;

export const { array: InvoiceList, parse: parseInvoicesJson } = collectionHelpers(Invoice);
