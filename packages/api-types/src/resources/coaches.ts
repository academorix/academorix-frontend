/**
 * coaches.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in coaches.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BranchId, CoachId, OrganizationId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Coache = z
  .object({
    id: CoachId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    staff_id: StaffId,
    sports: z.array(z.string()),
    specialization: z.string(),
    years_experience: z.number(),
    bio: z.string(),
    sport_certifications: z.array(z.record(z.string(), z.unknown()).loose()),
    is_head_coach: z.boolean(),
    is_active: z.boolean(),
    accepts_private_sessions: z.boolean(),
    hourly_rate_minor: z.number(),
    currency: z.enum(["USD"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Coache = z.infer<typeof Coache>;

export const { array: CoacheList, parse: parseCoachesJson } = collectionHelpers(Coache);
