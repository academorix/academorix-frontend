/**
 * day-passes.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in day-passes.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { DayPassStatus, HolderType } from "../enums.js";
import {
  AthleteId,
  BranchId,
  DayPassId,
  LeadId,
  OrganizationId,
  TenantId,
  UserId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const DayPasse = z
  .object({
    id: DayPassId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    holder_type: HolderType,
    holder_name: z.string(),
    related_athlete_id: AthleteId.nullable(),
    related_lead_id: LeadId.nullable(),
    issued_by_user_id: UserId,
    valid_from: z.enum([
      "2026-06-20T18:00:00Z",
      "2026-06-29T15:00:00Z",
      "2026-07-06T15:45:00Z",
      "2026-07-12T09:30:00Z",
    ]),
    valid_to: z.enum([
      "2026-06-20T21:00:00Z",
      "2026-06-29T18:00:00Z",
      "2026-07-06T18:00:00Z",
      "2026-07-12T12:30:00Z",
    ]),
    access_zones: z.array(z.string()),
    status: DayPassStatus,
    used_at: Timestamp.nullable(),
    voided_reason: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type DayPasse = z.infer<typeof DayPasse>;

export const { array: DayPasseList, parse: parseDayPassesJson } = collectionHelpers(DayPasse);
