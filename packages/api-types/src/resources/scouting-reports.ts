/**
 * scouting-reports.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in scouting-reports.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { AthleteEnrollmentId, AthleteId, EventId, MatchId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ScoutingReport = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    athlete_id: AthleteId,
    enrollment_id: AthleteEnrollmentId,
    scout_id: StaffId,
    sport_key: SportKey,
    event_id: EventId.nullable(),
    match_id: MatchId.nullable(),
    assessed_at: Timestamp,
    rating: z.number(),
    strengths: z.array(z.string()),
    improvement_areas: z.array(z.string()),
    recommendation: z.enum(["confirm", "hold_and_review", "promote"]),
    summary: z.string(),
    restricted: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ScoutingReport = z.infer<typeof ScoutingReport>;

export const { array: ScoutingReportList, parse: parseScoutingReportsJson } =
  collectionHelpers(ScoutingReport);
