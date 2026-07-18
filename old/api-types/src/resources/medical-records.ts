/**
 * medical-records.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in medical-records.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, MedicalRecordId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MedicalRecord = z
  .object({
    id: MedicalRecordId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    type: z.enum(["record"]),
    summary: z.string(),
    allergies: z.array(z.string()),
    medications: z.array(z.string()),
    conditions: z.array(z.string()),
    emergency_contact: z.record(z.string(), z.unknown()),
    recorded_by: z.string(),
    recorded_at: Timestamp,
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type MedicalRecord = z.infer<typeof MedicalRecord>;

export const { array: MedicalRecordList, parse: parseMedicalRecordsJson } =
  collectionHelpers(MedicalRecord);
