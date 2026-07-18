/**
 * injuries.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in injuries.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { InjurySeverity, InjuryStatus } from "../enums.js";
import { AthleteId, InjuryId, MedicalClearanceId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Injurie = z
  .object({
    id: InjuryId,
    tenant_id: TenantId,
    athlete_id: AthleteId,
    reported_at: Timestamp,
    reported_by: z.string(),
    description: z.string(),
    body_part: z.enum(["ankle_right", "head", "knee_left", "shoulder_right"]),
    mechanism: z.enum(["collision", "landing_tackle", "overuse"]),
    severity: InjurySeverity,
    status: InjuryStatus,
    expected_return: z.enum(["2025-12-06", "2026-05-05", "2026-07-01", "2026-07-10"]),
    resolved_at: Timestamp.nullable(),
    treatment_notes: z.string(),
    clearance_id: MedicalClearanceId.nullable(),
    blocks_selection: z.boolean(),
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Injurie = z.infer<typeof Injurie>;

export const { array: InjurieList, parse: parseInjuriesJson } = collectionHelpers(Injurie);
