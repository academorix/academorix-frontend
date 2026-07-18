/**
 * consents.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in consents.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ConsentStatus } from "../enums.js";
import { AthleteId, ConsentId, DocumentId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Consent = z
  .object({
    id: ConsentId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    granted_by_user_id: UserId,
    category: z.enum([
      "data_share_cross_academy",
      "data_share_marketing",
      "medical",
      "photo",
      "transport",
    ]),
    status: ConsentStatus,
    granted_at: Timestamp,
    revoked_at: Timestamp.nullable(),
    expires_at: Timestamp.nullable(),
    evidence_document_id: DocumentId.nullable(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Consent = z.infer<typeof Consent>;

export const { array: ConsentList, parse: parseConsentsJson } = collectionHelpers(Consent);
