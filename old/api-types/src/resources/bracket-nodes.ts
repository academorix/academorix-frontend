/**
 * bracket-nodes.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in bracket-nodes.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BracketNodeStatus } from "../enums.js";
import { BracketNodeId, CompetitionId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const BracketNode = z
  .object({
    id: BracketNodeId,
    tenant_id: TenantId,
    competition_id: CompetitionId,
    round: z.number(),
    position: z.number(),
    home_team_id: TeamId.nullable(),
    away_team_id: TeamId.nullable(),
    winner_team_id: TeamId.nullable(),
    next_node_id: BracketNodeId.nullable(),
    status: BracketNodeStatus,
    fixture_id: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    scheduled_at: Timestamp.nullable().optional(),
    notes: z.string().optional(),
    round_key: z.enum(["final", "qf", "sf", "third_place"]).optional(),
    feeder_left_node_id: BracketNodeId.nullable().optional(),
    feeder_right_node_id: BracketNodeId.nullable().optional(),
    score_home: z.number().optional(),
    score_away: z.number().optional(),
  })
  .loose();
export type BracketNode = z.infer<typeof BracketNode>;

export const { array: BracketNodeList, parse: parseBracketNodesJson } =
  collectionHelpers(BracketNode);
