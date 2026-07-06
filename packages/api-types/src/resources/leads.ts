/**
 * leads.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in leads.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { LeadStage, LeadStatus, SportKey } from "../enums.js";
import {
  AthleteId,
  BranchId,
  LeadId,
  OrganizationId,
  RegionId,
  StaffId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Lead = z
  .object({
    id: LeadId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    region_id: RegionId,
    name: z.string(),
    contact_first_name: z.enum(["Arjun", "Chidi", "Linh", "Priya", "Rachel"]),
    contact_last_name: z.enum(["Carter", "Nguyen", "Okafor", "Singh"]).nullable(),
    contact_email: z.string().nullable(),
    contact_phone: z.string().nullable(),
    sport_key: SportKey.nullable(),
    stage: LeadStage,
    status: LeadStatus,
    source: z.enum(["referral", "social", "walk_in", "web"]),
    source_detail: z
      .enum([
        "existing-member-referral",
        "instagram-summer-camp",
        "landing-page-basketball",
        "landing-page-summer-2026",
      ])
      .nullable(),
    owner_user_id: UserId.nullable(),
    assigned_staff_id: StaffId.nullable(),
    note: z.string(),
    next_action_at: Timestamp.nullable(),
    converted_at: Timestamp.nullable(),
    converted_athlete_id: AthleteId.nullable(),
    lost_reason: z.enum(["location"]).nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Lead = z.infer<typeof Lead>;

export const { array: LeadList, parse: parseLeadsJson } = collectionHelpers(Lead);
