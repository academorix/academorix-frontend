/**
 * match-squad.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in match-squad.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MatchSquadRole } from "../enums.js";
import { AthleteId, EventId, MatchId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MatchSquad = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    event_id: EventId,
    match_id: MatchId,
    athlete_id: AthleteId,
    role: MatchSquadRole,
    position_code: z
      .enum(["CM", "GK", "LB", "LCB", "LCM", "LW", "RB", "RCB", "RCM", "RW", "ST"])
      .nullable(),
    shirt_x: z.number().nullable(),
    shirt_y: z.number().nullable(),
    formation: z.string().nullable(),
    is_captain: z.boolean(),
    jersey_number: z.number(),
    is_starting_xi: z.boolean(),
    published_at: Timestamp,
    ordering: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type MatchSquad = z.infer<typeof MatchSquad>;

export const { array: MatchSquadList, parse: parseMatchSquadJson } = collectionHelpers(MatchSquad);
