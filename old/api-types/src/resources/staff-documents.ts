/**
 * staff-documents.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in staff-documents.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { StaffDocumentStatus } from "../enums.js";
import { DocumentId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StaffDocument = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    staff_id: StaffId,
    doc_id: DocumentId,
    doc_kind: z.enum(["contract", "dbs_check", "first_aid_certificate", "visa"]),
    reference: z.enum(["CT-2025-MARCO", "DBS-2024-88771", "FA-2022-4419", "USW-2025-88112"]),
    issued_at: Timestamp,
    expires_at: Timestamp,
    status: StaffDocumentStatus,
    notify_before_days: z.number(),
    uploaded_by: z.string(),
    uploaded_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type StaffDocument = z.infer<typeof StaffDocument>;

export const { array: StaffDocumentList, parse: parseStaffDocumentsJson } =
  collectionHelpers(StaffDocument);
