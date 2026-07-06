/**
 * certifications.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in certifications.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CertificationStatus, SportKey } from "../enums.js";
import { CertificationId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Certification = z
  .object({
    id: CertificationId,
    tenant_id: TenantId,
    staff_id: StaffId,
    code: z.enum(["ASA_L2", "FA_Youth_Award", "FIGC_Youth", "Pool_Lifeguard", "UEFA_B"]),
    name: z.string(),
    sport_key: SportKey,
    level: z.enum(["B", "L2", "NPLQ", "Youth"]),
    issuing_authority: z.string(),
    issued_at: Timestamp,
    expires_at: Timestamp.nullable(),
    status: CertificationStatus,
    document_id: z.unknown().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Certification = z.infer<typeof Certification>;

export const { array: CertificationList, parse: parseCertificationsJson } =
  collectionHelpers(Certification);
