/**
 * medical-clearances.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in medical-clearances.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MedicalClearanceStatus, MedicalClearanceType } from "../enums.js";
import { AthleteId, DocumentId, MedicalClearanceId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MedicalClearance = z
  .object({
    id: MedicalClearanceId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    type: MedicalClearanceType,
    issued_at: Timestamp.nullable(),
    expires_at: Timestamp.nullable(),
    status: MedicalClearanceStatus,
    issued_by: z.string().nullable(),
    notes: z.string(),
    document_id: DocumentId.nullable(),
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type MedicalClearance = z.infer<typeof MedicalClearance>;

export const { array: MedicalClearanceList, parse: parseMedicalClearancesJson } =
  collectionHelpers(MedicalClearance);
