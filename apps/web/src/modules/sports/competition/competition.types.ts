/**
 * @file competition.types.ts
 * @module modules/sports/competition/competition.types
 *
 * @description
 * Module-local shapes for **competitions & standings** — a league/knockout a
 * team competes in, plus the computed standings row per participating team.
 * Kept local because these are competition-specific projections; the shared
 * `Match` shape (which references `competition_id`) lives in `@/types`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.6 "Competitions & Standings"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** The structural format of a competition. */
export const COMPETITION_FORMATS = ["league", "knockout", "friendly"] as const;

/** A single competition format (e.g. `"league"`). */
export type CompetitionFormat = (typeof COMPETITION_FORMATS)[number];

/** Human-readable labels for {@link CompetitionFormat}. */
export const COMPETITION_FORMAT_LABELS: Record<CompetitionFormat, string> = {
  league: "League",
  knockout: "Knockout",
  friendly: "Friendly",
};

/** The lifecycle of a competition. */
export const COMPETITION_STATUSES = ["upcoming", "active", "completed"] as const;

/** A single competition status (e.g. `"active"`). */
export type CompetitionStatus = (typeof COMPETITION_STATUSES)[number];

/** Human-readable labels for {@link CompetitionStatus}. */
export const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
};

/**
 * A **Competition** a tenant's teams take part in (internal league, external
 * cup, friendly series). Sport-agnostic via `sport_key`.
 */
export interface Competition extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  season_id: string | null;
  sport_key: string;
  name: string;
  format: CompetitionFormat;
  status: CompetitionStatus;
}

/**
 * A **standings** row for one team in a competition. Points are precomputed by
 * the sport's scoring strategy; goal difference is derived in the UI.
 */
export interface CompetitionStanding extends BaseModel, TenantScoped {
  competition_id: string;
  team_id: string;
  /** Denormalized team display name for the table. */
  team_name: string;
  /** 1-based position in the table. */
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}
