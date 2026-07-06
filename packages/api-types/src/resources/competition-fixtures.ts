/**
 * competition-fixtures.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in competition-fixtures.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CompetitionFixtureStatus } from "../enums.js";
import { BracketNodeId, CompetitionId, EventId, MatchId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CompetitionFixture = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    competition_id: CompetitionId,
    round: z.number(),
    match_id: MatchId.nullable(),
    home_team_id: TeamId,
    home_team_name: z.string(),
    away_team_id: TeamId.nullable(),
    away_team_name: z.string(),
    scheduled_at: Timestamp,
    status: CompetitionFixtureStatus,
    home_score: z.number().nullable(),
    away_score: z.number().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    bracket_node_id: BracketNodeId.optional(),
    linked_event_id: EventId.optional(),
    notes: z.string().optional(),
  })
  .loose();
export type CompetitionFixture = z.infer<typeof CompetitionFixture>;

export const { array: CompetitionFixtureList, parse: parseCompetitionFixturesJson } =
  collectionHelpers(CompetitionFixture);
