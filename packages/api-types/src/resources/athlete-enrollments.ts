/**
 * athlete-enrollments.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in athlete-enrollments.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteEnrollmentStatus, SportKey } from "../enums.js";
import {
  AthleteEnrollmentId,
  AthleteId,
  BranchId,
  OrganizationId,
  SeasonId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AthleteEnrollment = z
  .object({
    id: AthleteEnrollmentId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    athlete_id: AthleteId,
    sport_key: SportKey,
    team_id: TeamId,
    season_id: SeasonId,
    squad_role: z.enum(["defender", "forward", "goalkeeper", "midfielder"]).nullable(),
    level: z.enum(["advanced", "beginner", "intermediate"]),
    status: AthleteEnrollmentStatus,
    enrolled_at: Timestamp,
    attribute_set_version: z.number(),
    attributes: z.record(z.string(), z.unknown()),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
    notes: z.string().optional(),
  })
  .loose();
export type AthleteEnrollment = z.infer<typeof AthleteEnrollment>;

export const { array: AthleteEnrollmentList, parse: parseAthleteEnrollmentsJson } =
  collectionHelpers(AthleteEnrollment);
