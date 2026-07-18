/**
 * documents.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in documents.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { DocumentOwnerType, DocumentType } from "../enums.js";
import { DocumentId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Document = z
  .object({
    id: DocumentId,
    tenant_id: TenantId,
    owner_type: DocumentOwnerType,
    owner_id: z.string(),
    type: DocumentType,
    filename: z.string(),
    mime: z.enum(["application/pdf", "image/jpeg"]),
    size_bytes: z.number(),
    scan_status: z.enum(["clean", "infected", "pending"]),
    expiry_at: Timestamp.nullable(),
    storage_url: z.string(),
    uploaded_by: z.string(),
    uploaded_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type Document = z.infer<typeof Document>;

export const { array: DocumentList, parse: parseDocumentsJson } = collectionHelpers(Document);
