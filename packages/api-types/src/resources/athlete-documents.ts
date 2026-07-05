/**
 * athlete-documents.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in athlete-documents.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteDocumentStatus } from "../enums.js";
import { AthleteId, DocumentId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AthleteDocument = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    athlete_id: AthleteId,
    doc_id: DocumentId,
    doc_kind: z.enum(["insurance", "medical", "passport", "photo_id"]),
    expires_at: Timestamp.nullable(),
    status: AthleteDocumentStatus,
    uploaded_by: z.string(),
    uploaded_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type AthleteDocument = z.infer<typeof AthleteDocument>;

export const { array: AthleteDocumentList, parse: parseAthleteDocumentsJson } =
  collectionHelpers(AthleteDocument);
