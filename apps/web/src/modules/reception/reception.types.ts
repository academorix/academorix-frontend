/**
 * @file reception.types.ts
 * @module modules/reception/reception.types
 *
 * @description
 * Module-local type for the front-desk approvals queue. Kept local because the
 * approval task is a thin, reception-specific projection; shared domain shapes
 * live in `@/types`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.20 "Reception & Front Desk"
 */

import type { BaseModel, TenantScoped } from "@/types";
import type { ApprovalStatus } from "@/types";

/** A pending action the front desk must approve or reject. */
export interface ApprovalTask extends BaseModel, TenantScoped {
  branch_id: string;
  /** Task kind, e.g. `"registration"`, `"document"`, `"refund"`. */
  type: string;
  /** Human summary of what needs approval. */
  subject: string;
  /** Who raised the task (user id or name). */
  requested_by: string;
  status: ApprovalStatus;
}
