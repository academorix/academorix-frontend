/**
 * treatments.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in treatments.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteId, InjuryId, TenantId, TreatmentId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Treatment = z
  .object({
    id: TreatmentId,
    tenant_id: TenantId,
    injury_id: InjuryId,
    athlete_id: AthleteId,
    provider: z.string(),
    treatment_type: z.enum(["imaging", "manual_therapy", "physio", "strength_program"]),
    notes: z.string(),
    duration_minutes: z.number(),
    cost_minor: z.number(),
    currency: z.enum(["USD"]),
    restricted: z.boolean(),
    performed_by_user_id: UserId,
    performed_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Treatment = z.infer<typeof Treatment>;

export const { array: TreatmentList, parse: parseTreatmentsJson } = collectionHelpers(Treatment);
