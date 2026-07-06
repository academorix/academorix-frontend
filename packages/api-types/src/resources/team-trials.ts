/**
 * team-trials.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in team-trials.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey, TrialStatus } from "../enums.js";
import {
  AthleteId,
  BranchId,
  FacilityId,
  OrganizationId,
  RegionId,
  SeasonId,
  StaffId,
  TeamId,
  TeamTrialId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TeamTrial = z
  .object({
    id: TeamTrialId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    season_id: SeasonId,
    sport_key: SportKey,
    team_id: TeamId,
    registration_id: RegionId.nullable(),
    athlete_id: AthleteId.nullable(),
    applicant_name: z.string(),
    coach_id: StaffId,
    starts_at: Timestamp,
    ends_at: Timestamp,
    resource_id: FacilityId.nullable(),
    status: TrialStatus,
    outcome: z.enum(["offer_extended", "reject"]).nullable(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type TeamTrial = z.infer<typeof TeamTrial>;

export const { array: TeamTrialList, parse: parseTeamTrialsJson } = collectionHelpers(TeamTrial);
