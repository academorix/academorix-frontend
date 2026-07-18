/**
 * attendance-submissions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in attendance-submissions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { DateOnly, Timestamp } from "../common.js";
import { ActivityType, AttendanceSubmissionStatus, SportKey } from "../enums.js";
import {
  ApprovalTaskId,
  AttendanceSubmissionId,
  BranchId,
  OrganizationId,
  TeamId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const AttendanceSubmission = z
  .object({
    id: AttendanceSubmissionId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId,
    event_id: z.string(),
    activity_type: ActivityType,
    activity_date: DateOnly,
    sport_key: SportKey,
    status: AttendanceSubmissionStatus,
    total_expected: z.number(),
    total_present: z.number(),
    total_late: z.number(),
    total_absent: z.number(),
    total_excused: z.number(),
    submitted_by: z.string().nullable(),
    submitted_at: Timestamp.nullable(),
    confirmed_by: z.string().nullable(),
    confirmed_at: Timestamp.nullable(),
    rejection_reason: z.string().nullable(),
    linked_attendance_ids: z.array(z.string()),
    created_at: Timestamp,
    updated_at: Timestamp,
    approval_task_id: ApprovalTaskId.optional(),
  })
  .loose();
export type AttendanceSubmission = z.infer<typeof AttendanceSubmission>;

export const { array: AttendanceSubmissionList, parse: parseAttendanceSubmissionsJson } =
  collectionHelpers(AttendanceSubmission);
