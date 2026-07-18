/**
 * awards.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in awards.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, CertificateId, DocumentId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Award = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    athlete_id: AthleteId,
    award_type_id: z.string(),
    type: z.string(),
    title: z.string(),
    description: z.string(),
    granted_by: z.enum(["stf_coach_mike", "stf_coach_sara", "system"]),
    granted_at: Timestamp,
    evidence_ref: z.string().nullable(),
    certificate_id: CertificateId.nullable(),
    certificate_document_id: DocumentId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Award = z.infer<typeof Award>;

export const { array: AwardList, parse: parseAwardsJson } = collectionHelpers(Award);
