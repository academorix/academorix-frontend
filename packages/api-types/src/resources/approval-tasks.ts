/**
 * approval-tasks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in approval-tasks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ApprovableType, ApprovalTaskStatus } from "../enums.js";
import { ApprovalTaskId, BranchId, OrganizationId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ApprovalTask = z
  .object({
    id: ApprovalTaskId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId.nullable(),
    approvable_type: ApprovableType,
    approvable_id: z.string(),
    subject: z.string(),
    requested_by: z.string(),
    requested_by_email: z.string(),
    assigned_to: z.string(),
    status: ApprovalTaskStatus,
    reason: z.string().nullable(),
    decided_at: Timestamp.nullable(),
    decided_by: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ApprovalTask = z.infer<typeof ApprovalTask>;

export const { array: ApprovalTaskList, parse: parseApprovalTasksJson } =
  collectionHelpers(ApprovalTask);
