/**
 * @file scheduling.ts
 * @module types/scheduling
 *
 * @description
 * Scheduling & participation shapes: events + RSVP invitations, training
 * sessions, matches, private sessions, and attendance marks. These are the
 * calendar/participation backbone of the sports domain.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13 "Scheduling & participation"
 */

import type { BaseModel, TenantScoped } from "@/types/base";
import type {
  AttendanceStatus,
  EntityStatus,
  EventStatus,
  EventType,
  MatchStatus,
  RsvpStatus,
} from "@/types/enums";

/**
 * An **Event** — a scheduled activity (training/match/session/meeting) the squad
 * is invited to. The per-sport display term comes from registry terminology.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.1 "Events, Invitations & RSVP"
 */
export interface Event extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  team_id: string | null;
  season_id: string | null;
  title: string;
  type: EventType;
  status: EventStatus;
  /** ISO-8601 start timestamp. */
  starts_at: string;
  /** ISO-8601 end timestamp. */
  ends_at: string;
  /** Venue/location free text or facility reference. */
  location: string | null;
  /** RSVP counts, denormalized for list badges. */
  rsvp_going: number;
  rsvp_total: number;
}

/**
 * An invitation to an event for one athlete/guardian, carrying their RSVP.
 */
export interface EventInvitation extends BaseModel, TenantScoped {
  event_id: string;
  athlete_id: string;
  rsvp: RsvpStatus;
  /** ISO-8601 time the RSVP was last set, or `null` if still pending. */
  responded_at: string | null;
}

/**
 * A **Training** session — a coached practice for a team.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.2 "Training"
 */
export interface TrainingSession extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  team_id: string;
  season_id: string | null;
  /** Linked event id (training is an event kind), or `null` if standalone. */
  event_id: string | null;
  title: string;
  /** ISO-8601 start timestamp. */
  starts_at: string;
  /** Duration in minutes. */
  duration_minutes: number;
  status: EventStatus;
  /** Coaching staff id leading the session. */
  coach_id: string | null;
  /** Focus/objective summary. */
  focus: string | null;
}

/**
 * A **Match** — a competitive fixture. The result/scoring shape is driven by the
 * sport's scoring strategy (mechanism #4).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.3 "Matches"
 */
export interface Match extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  team_id: string;
  season_id: string | null;
  competition_id: string | null;
  sport_key: string;
  /** Opponent name (free text for friendlies; team ref for league play). */
  opponent: string;
  /** Whether the team plays at home. */
  is_home: boolean;
  status: MatchStatus;
  /** ISO-8601 kick-off timestamp. */
  starts_at: string;
  location: string | null;
  /** Team's score, or `null` before the result is recorded. */
  score_for: number | null;
  /** Opponent's score, or `null`. */
  score_against: number | null;
}

/**
 * A **Private Session** — a 1:1 or small-group booking with a coach.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.4 "Private Sessions"
 */
export interface PrivateSession extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  season_id: string | null;
  /** The coaching staff member delivering the session. */
  coach_id: string;
  /** The athlete receiving the session. */
  athlete_id: string;
  sport_key: string;
  /** ISO-8601 start timestamp. */
  starts_at: string;
  duration_minutes: number;
  status: EventStatus;
  /** Price for the session (decimal string), or `null` if bundled. */
  price: string | null;
  currency: string | null;
}

/**
 * An **Attendance** mark for one athlete at a session/event, captured on the
 * field (offline-capable) then reviewed/confirmed.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance"
 */
export interface Attendance extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  team_id: string | null;
  /** The event/session this mark belongs to. */
  event_id: string;
  athlete_id: string;
  status: AttendanceStatus;
  /** Whether a head coach/admin has confirmed the submitted marks. */
  is_confirmed: boolean;
  /** ISO-8601 time the mark was recorded. */
  marked_at: string;
  /** Optional note (reason for absence, lateness). */
  note: string | null;
}

/**
 * Reusable status alias for scheduling records that share the generic entity
 * lifecycle (kept for clarity at call sites).
 */
export type SchedulingEntityStatus = EntityStatus;
