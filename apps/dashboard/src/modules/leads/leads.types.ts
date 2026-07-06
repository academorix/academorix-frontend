/**
 * @file leads.types.ts
 * @module modules/leads/leads.types
 *
 * @description
 * Module-local shapes for the **leads CRM** — prospective members moving through
 * an acquisition pipeline before they become a formal registration. Kept local
 * because a lead is a sales-pipeline projection; once converted it becomes a
 * `Registration` (shared, in `@/types`).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.3 "Leads & CRM"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** The pipeline stage a lead currently sits in. */
export const LEAD_STAGES = [
  "new",
  "contacted",
  "qualified",
  "trial_booked",
  "won",
  "lost",
] as const;

/** A single lead stage (e.g. `"contacted"`). */
export type LeadStage = (typeof LEAD_STAGES)[number];

/** Human-readable labels for {@link LeadStage}. */
export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  trial_booked: "Trial Booked",
  won: "Won",
  lost: "Lost",
};

/**
 * A **Lead** — a prospective member/guardian captured from an acquisition
 * channel and worked through the pipeline by an owner.
 */
export interface Lead extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** Prospect display name. */
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  /** Sport of interest, or `null` if undecided. */
  sport_key: string | null;
  stage: LeadStage;
  /** Acquisition channel, e.g. `"web"`, `"referral"`, `"walk_in"`, `"social"`. */
  source: string;
  /** Staff member who owns the lead, or `null` if unassigned. */
  owner_id: string | null;
  /** Free-text pipeline note. */
  note: string | null;
}
