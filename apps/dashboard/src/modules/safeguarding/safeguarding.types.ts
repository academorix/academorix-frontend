/**
 * @file safeguarding.types.ts
 * @module modules/safeguarding/safeguarding.types
 *
 * @description
 * Module-local shapes for **safeguarding cases** — welfare/child-protection
 * concerns tracked with a severity and lifecycle. **Sensitive data**: gated
 * behind the `safeguarding` permission; only designated safeguarding leads and
 * admins see this module. Kept local as a compliance-specific projection.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.21 "Safeguarding & Welfare"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** How serious a safeguarding concern is. */
export const SAFEGUARDING_SEVERITIES = ["low", "medium", "high", "critical"] as const;

/** A single safeguarding severity (e.g. `"high"`). */
export type SafeguardingSeverity = (typeof SAFEGUARDING_SEVERITIES)[number];

/** Human-readable labels for {@link SafeguardingSeverity}. */
export const SAFEGUARDING_SEVERITY_LABELS: Record<SafeguardingSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** The lifecycle of a safeguarding case. */
export const SAFEGUARDING_STATUSES = ["open", "monitoring", "escalated", "closed"] as const;

/** A single safeguarding status (e.g. `"open"`). */
export type SafeguardingStatus = (typeof SAFEGUARDING_STATUSES)[number];

/** Human-readable labels for {@link SafeguardingStatus}. */
export const SAFEGUARDING_STATUS_LABELS: Record<SafeguardingStatus, string> = {
  open: "Open",
  monitoring: "Monitoring",
  escalated: "Escalated",
  closed: "Closed",
};

/**
 * A **safeguarding case** — a logged welfare concern, optionally tied to an
 * athlete (or general/facility when `athlete_id` is `null`), owned by a handler
 * and tracked through its lifecycle.
 */
export interface SafeguardingCase extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** Subject athlete, or `null` for a general/facility concern. */
  athlete_id: string | null;
  /** Concern category, e.g. `"welfare"`, `"conduct"`, `"facility_safety"`. */
  category: string;
  severity: SafeguardingSeverity;
  status: SafeguardingStatus;
  /** Non-graphic case summary. */
  summary: string;
  /** Designated safeguarding lead handling the case (staff id). */
  handler_id: string | null;
  /** ISO-8601 date the case was opened. */
  opened_at: string;
}
