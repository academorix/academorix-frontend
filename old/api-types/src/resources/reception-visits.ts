/**
 * reception-visits.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in reception-visits.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import {
  AthleteId,
  BranchId,
  LeadId,
  OrganizationId,
  ReceptionVisitId,
  RegionId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ReceptionVisit = z
  .object({
    id: ReceptionVisitId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    visit_type: z.enum(["contractor", "delivery", "drop_off", "tour", "trial", "walk_in"]),
    visitor_name: z.string(),
    related_athlete_id: AthleteId.nullable(),
    related_lead_id: LeadId.nullable(),
    related_registration_id: RegionId.nullable(),
    related_day_pass_id: z.unknown().nullable(),
    handled_by_user_id: UserId,
    arrived_at: Timestamp,
    departed_at: Timestamp,
    purpose_note: z.string(),
    outcome: z.enum(["complete", "converted", "lead_captured"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ReceptionVisit = z.infer<typeof ReceptionVisit>;

export const { array: ReceptionVisitList, parse: parseReceptionVisitsJson } =
  collectionHelpers(ReceptionVisit);
