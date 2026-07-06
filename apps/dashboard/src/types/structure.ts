/**
 * @file structure.ts
 * @module types/structure
 *
 * @description
 * Structural domain shapes layered on the platform hierarchy: seasons, teams
 * (squads/classes), team membership, and the acquisition registration funnel.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.3 (Seasons), §12.2 (Teams), §12.4 (Enrollment)
 */

import type { BaseModel, TenantScoped } from "@/types/base";
import type {
  EntityStatus,
  RegistrationStatus,
  SeasonStatus,
  SkillLevel,
  TeamPosition,
} from "@/types/enums";

/**
 * A **Season** — a real boundary with registration windows and age cut-offs.
 * Teams, competitions, and enrollments reference `season_id`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.3 "Seasons & Registration"
 */
export interface Season extends BaseModel, TenantScoped {
  organization_id: string;
  name: string;
  status: SeasonStatus;
  /** ISO-8601 season start date. */
  start_date: string;
  /** ISO-8601 season end date. */
  end_date: string;
  /** Whether this is the tenant's current season (drives the switcher default). */
  is_current: boolean;
  /** ISO-8601 age cut-off date used for eligibility, or `null`. */
  age_cutoff_date: string | null;
}

/**
 * A **Team** — a squad/class/training group at a branch. Squad-size rules come
 * from the sport registry's tactical config.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4, §12.2
 */
export interface Team extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** Season this team instance belongs to (multi-season history). */
  season_id: string | null;
  name: string;
  description: string | null;
  /** Sport discriminator, e.g. `"football"`. */
  sport_key: string;
  /** Free-text age band, e.g. `"U12"`. */
  age_group: string;
  level: SkillLevel;
  status: EntityStatus;
  /** Lead coach's staff id, or `null`. */
  lead_coach_id: string | null;
  /** Current roster size (denormalized for lists). */
  members_count: number;
  /** Maximum roster size, from the sport's tactical config or an override. */
  capacity: number;
}

/**
 * Membership of a person on a team, with a position (distinct from RBAC role).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4 (team_members)
 */
export interface TeamMember extends BaseModel, TenantScoped {
  team_id: string;
  /** Athlete id for players; staff id for coaching positions. */
  member_id: string;
  /** Whether `member_id` refers to an athlete or a staff member. */
  member_type: "athlete" | "staff";
  position: TeamPosition;
  /** Whether this member is the team captain. */
  is_captain: boolean;
  /** ISO-8601 date the member joined the roster. */
  joined_at: string;
}

/**
 * A self-service registration moving through the acquisition funnel
 * (lead → trial → offer → enrolled/waitlisted).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.4 "Enrollment & Waitlist"
 */
export interface Registration extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  season_id: string | null;
  /** Prospective athlete's name (before an Athlete record exists). */
  applicant_name: string;
  /** Guardian/contact email. */
  contact_email: string;
  contact_phone: string | null;
  /** Sport of interest. */
  sport_key: string;
  status: RegistrationStatus;
  /** Linked athlete id once enrolled, or `null`. */
  athlete_id: string | null;
  /** ISO-8601 submission timestamp. */
  submitted_at: string;
}
