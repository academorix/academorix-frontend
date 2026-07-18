/**
 * teams.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in teams.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import {
  AgeGroupId,
  BranchId,
  OrganizationId,
  SeasonId,
  StaffId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Team = z
  .object({
    id: TeamId,
    tenant_id: TenantId,
    organization_id: OrganizationId.nullable(),
    branch_id: BranchId.nullable(),
    season_id: SeasonId.nullable(),
    name: z.string(),
    slug: z.enum([
      "central-united",
      "eastside-eagles",
      "harbor-fc",
      "harbor-junior-swim",
      "junior-swim-squad",
      "rovers-fc",
      "u10-sharks",
      "u12-falcons",
      "u12-falcons-dev",
      "united-youth",
    ]),
    description: z.string().nullable(),
    sport_key: SportKey,
    age_group_id: AgeGroupId.nullable(),
    age_group: z.enum(["U10", "U12", "U14"]),
    level: z.enum(["beginner", "intermediate"]).nullable(),
    status: z.enum(["active", "external"]),
    lead_coach_id: StaffId.nullable(),
    members_count: z.number().nullable(),
    capacity: z.number().nullable(),
    match_format: z.enum(["11v11", "7v7", "9v9"]).nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    is_external: z.boolean().optional(),
    opponent_logo_key: z
      .enum(["central-united", "eastside-eagles", "harbor-fc", "rovers-fc", "united-youth"])
      .optional(),
    external_tenant_id: TenantId.optional(),
  })
  .loose();
export type Team = z.infer<typeof Team>;

export const { array: TeamList, parse: parseTeamsJson } = collectionHelpers(Team);
