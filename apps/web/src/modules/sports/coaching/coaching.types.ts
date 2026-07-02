/**
 * @file coaching.types.ts
 * @module modules/sports/coaching/coaching.types
 *
 * @description
 * Module-local type for a coaching assignment — the link between a
 * {@link "@/types".Staff} member (the coach) and a team for a season. Coaching is
 * a thin view over Staff, so this projection lives in the module rather than in
 * the shared types.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.3 "Coaching"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** A coach's assignment to a team for a season. */
export interface CoachAssignment extends BaseModel, TenantScoped {
  branch_id: string;
  season_id: string | null;
  /** The assigned staff member (the coach). */
  staff_id: string;
  /** The team the coach is assigned to. */
  team_id: string;
  /** Coaching role, e.g. `"head_coach"`, `"assistant"`, `"goalkeeping"`. */
  role: string;
}
