/**
 * athlete-guardians.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in athlete-guardians.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteGuardianId, AthleteId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AthleteGuardian = z
  .object({
    id: AthleteGuardianId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    user_id: UserId,
    relationship: z.enum(["father", "guardian", "mother"]),
    order: z.number(),
    is_primary: z.boolean(),
    consent_photo: z.boolean(),
    consent_medical: z.boolean(),
    consent_transport: z.boolean(),
    added_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type AthleteGuardian = z.infer<typeof AthleteGuardian>;

export const { array: AthleteGuardianList, parse: parseAthleteGuardiansJson } =
  collectionHelpers(AthleteGuardian);
