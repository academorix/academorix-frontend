/**
 * attendance.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in attendance.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ActivityType, AttendanceMethod, AttendanceStatus } from "../enums.js";
import { AthleteId, AttendanceId, BranchId, OrganizationId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Attendance = z
  .object({
    id: AttendanceId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId,
    event_id: z.string(),
    activity_type: ActivityType,
    athlete_id: AthleteId,
    status: AttendanceStatus,
    method: AttendanceMethod,
    submission_status: z.enum(["confirmed", "draft", "rejected", "submitted"]),
    submitted_by: z.string().nullable(),
    submitted_at: Timestamp.nullable(),
    confirmed_by: z.string().nullable(),
    confirmed_at: Timestamp.nullable(),
    is_confirmed: z.boolean(),
    marked_at: Timestamp,
    note: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Attendance = z.infer<typeof Attendance>;

export const { array: AttendanceList, parse: parseAttendanceJson } = collectionHelpers(Attendance);
