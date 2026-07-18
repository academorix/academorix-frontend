/**
 * standing-rows.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in standing-rows.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CompetitionId, StandingRowId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const StandingRow = z
  .object({
    id: StandingRowId,
    tenant_id: TenantId,
    competition_id: CompetitionId,
    team_id: TeamId,
    team_name: z.string(),
    rank: z.number(),
    played: z.number(),
    won: z.number(),
    drawn: z.number(),
    lost: z.number(),
    for: z.number(),
    against: z.number(),
    goal_diff: z.number(),
    points: z.number(),
    form: z.array(z.string()),
    as_of: z.enum(["2026-06-20T10:00:00Z"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type StandingRow = z.infer<typeof StandingRow>;

export const { array: StandingRowList, parse: parseStandingRowsJson } =
  collectionHelpers(StandingRow);
