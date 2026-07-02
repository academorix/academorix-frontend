/**
 * @file development.types.ts
 * @module modules/sports/development/development.types
 *
 * @description
 * Module-local type for **individual development plans (IDPs)** — coach-set
 * athlete goals with a lifecycle status and optional target date. Kept local
 * because an IDP is a lightweight planning projection; the richer shared
 * development shapes (Progress, PerformanceTest, Drill, Award) live in `@/types`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §14.4 "Development Plans (IDPs)"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** The lifecycle states a development-plan goal moves through. */
export const DEVELOPMENT_STATUSES = ["active", "achieved", "paused"] as const;

/** A single development-plan status (e.g. `"active"`). */
export type DevelopmentStatus = (typeof DEVELOPMENT_STATUSES)[number];

/** Human-readable labels for {@link DevelopmentStatus}. */
export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  active: "Active",
  achieved: "Achieved",
  paused: "Paused",
};

/**
 * An **individual development plan** goal for an athlete: a coach-authored
 * objective (e.g. "Improve weak-foot passing") tracked toward a target date.
 */
export interface DevelopmentPlan extends BaseModel, TenantScoped {
  /** The athlete this plan belongs to. */
  athlete_id: string;
  /** Sport the goal relates to (drives terminology/context). */
  sport_key: string;
  /** The development objective, in plain language. */
  goal: string;
  /** Where the goal currently sits in its lifecycle. */
  status: DevelopmentStatus;
  /** ISO-8601 target completion date, or `null` when open-ended. */
  target_date: string | null;
  /** Optional coach note / context. */
  note: string | null;
}
