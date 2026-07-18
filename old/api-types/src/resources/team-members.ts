/**
 * team-members.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in team-members.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AthleteEnrollmentId, AthleteId, TeamId, TeamMemberId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TeamMember = z
  .object({
    id: TeamMemberId,
    tenant_id: TenantId,
    team_id: TeamId,
    enrollment_id: AthleteEnrollmentId,
    member_id: AthleteId,
    member_type: z.enum(["athlete"]),
    position: z.enum(["defender", "forward", "midfielder"]).nullable(),
    is_captain: z.boolean(),
    jersey_number: z.number().nullable(),
    joined_at: Timestamp,
    left_at: z.unknown().nullable(),
    status: z.enum(["active", "trial"]),
    created_at: Timestamp,
    updated_at: Timestamp,
    _note: z.string().optional(),
  })
  .loose();
export type TeamMember = z.infer<typeof TeamMember>;

export const { array: TeamMemberList, parse: parseTeamMembersJson } = collectionHelpers(TeamMember);
