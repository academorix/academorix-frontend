/**
 * certificates.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in certificates.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, CertificateId, DocumentId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Certificate = z
  .object({
    id: CertificateId,
    tenant_id: TenantId,
    award_id: z.string(),
    athlete_id: AthleteId,
    template_key: z.string(),
    issued_at: Timestamp,
    document_id: DocumentId.nullable(),
    share_url: z.string().nullable(),
    download_url: z.string(),
    status: z.enum(["issued"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Certificate = z.infer<typeof Certificate>;

export const { array: CertificateList, parse: parseCertificatesJson } =
  collectionHelpers(Certificate);
