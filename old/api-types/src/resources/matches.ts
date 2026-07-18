/**
 * matches.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in matches.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MatchStatus, SportKey } from "../enums.js";
import {
  AthleteId,
  BranchId,
  CompetitionId,
  EventId,
  OrganizationId,
  SeasonId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Matche = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId,
    season_id: SeasonId,
    competition_id: CompetitionId.nullable(),
    event_id: EventId.nullable(),
    sport_key: SportKey,
    opponent: z.string(),
    opponent_logo_key: z
      .enum([
        "central-united",
        "eastside-eagles",
        "harbor-fc",
        "meadowbrook-fc",
        "riverside-fc",
        "rovers-fc",
        "united-youth",
      ])
      .nullable(),
    is_home: z.boolean(),
    match_format: z.enum(["11v11", "9v9"]),
    formation: z.string().nullable(),
    status: MatchStatus,
    starts_at: Timestamp,
    ends_at: Timestamp.nullable(),
    location: z.string(),
    result_status: z.enum(["final", "scheduled"]),
    home_score: z.number().nullable(),
    away_score: z.number().nullable(),
    score_for: z.number().nullable(),
    score_against: z.number().nullable(),
    man_of_match_athlete_id: AthleteId.nullable(),
    squad_published: z.boolean(),
    lineup_published_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    opponent_team_id: TeamId.optional(),
    is_archived: z.boolean().optional(),
    is_synthetic: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Matche = z.infer<typeof Matche>;

export const { array: MatcheList, parse: parseMatchesJson } = collectionHelpers(Matche);
