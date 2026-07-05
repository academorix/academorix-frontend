/**
 * coach-assignments.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in coach-assignments.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CoachAssignmentRole } from "../enums.js";
import { BranchId, OrganizationId, SeasonId, StaffId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const CoachAssignment = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    season_id: SeasonId,
    staff_id: StaffId,
    team_id: TeamId,
    role: CoachAssignmentRole,
    starts_at: Timestamp,
    ends_at: Timestamp.nullable(),
    is_active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type CoachAssignment = z.infer<typeof CoachAssignment>;

export const { array: CoachAssignmentList, parse: parseCoachAssignmentsJson } =
  collectionHelpers(CoachAssignment);
