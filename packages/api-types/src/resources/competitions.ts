/**
 * competitions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in competitions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CompetitionStatus, SportKey } from "../enums.js";
import {
  BranchId,
  CompetitionId,
  EventId,
  OrganizationId,
  SeasonId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Competition = z
  .object({
    id: CompetitionId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    season_id: SeasonId,
    sport_key: SportKey,
    name: z.string(),
    format: z.enum(["festival", "knockout", "league"]),
    scoring_type: z.enum(["goals", "time"]),
    status: CompetitionStatus,
    starts_at: Timestamp,
    ends_at: Timestamp,
    points_config: z.record(z.string(), z.unknown()).nullable(),
    team_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
    registration_opens_at: Timestamp.optional(),
    registration_closes_at: Timestamp.optional(),
    linked_event_id: EventId.optional(),
    team_ids: z.array(z.string()).optional(),
    notes: z.string().optional(),
    winner_team_id: TeamId.optional(),
    runner_up_team_id: TeamId.optional(),
    archived_at: Timestamp.optional(),
  })
  .loose();
export type Competition = z.infer<typeof Competition>;

export const { array: CompetitionList, parse: parseCompetitionsJson } =
  collectionHelpers(Competition);
