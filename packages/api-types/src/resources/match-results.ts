/**
 * match-results.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in match-results.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { AthleteId, MatchId, MatchResultId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MatchResult = z
  .object({
    id: MatchResultId,
    tenant_id: TenantId,
    match_id: MatchId,
    sport_key: SportKey,
    outcome: z.enum(["draw", "loss", "win"]),
    score_for: z.number(),
    score_against: z.number(),
    periods: z.array(z.record(z.string(), z.unknown()).loose()),
    scorers: z.array(z.record(z.string(), z.unknown()).loose()),
    cards: z.array(z.record(z.string(), z.unknown()).loose()),
    motm_athlete_id: AthleteId.nullable(),
    notes: z.string(),
    recap_summary: z.string(),
    recorded_by_user_id: UserId,
    recorded_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type MatchResult = z.infer<typeof MatchResult>;

export const { array: MatchResultList, parse: parseMatchResultsJson } =
  collectionHelpers(MatchResult);
