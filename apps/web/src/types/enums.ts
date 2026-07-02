/**
 * @file enums.ts
 * @module types/enums
 *
 * @description
 * Domain enumerations shared across the whole frontend. These mirror the
 * backend's authoritative enums (see the Laravel `Access`, `Tenancy`, and
 * `User` modules in `IDENTITY_AND_TENANCY_SPEC.md`) so the client speaks the
 * exact same vocabulary as the API.
 *
 * We intentionally model enums as `readonly` tuples plus a derived string
 * literal union (instead of TypeScript `enum`s). This keeps the values
 * tree-shakeable, JSON-serialisable, and identical to the raw snake_case
 * strings the REST API returns — no runtime translation layer required.
 *
 * Each enum ships a companion `*_LABELS` record so the UI has a single,
 * localisation-ready source of human-readable text.
 */

/**
 * RBAC roles are **not** modelled as a fixed union here — they are data seeded
 * per `business_type` on the backend and arrive as `string[]` on the identity
 * (see {@link AuthUser.roles}). Authorization is driven entirely by the
 * `permissions` list from `/auth/me`, never by hardcoded role constants.
 */

/**
 * The kind of business a tenant runs. Drives default role sets, terminology
 * labels, and feature toggles on the backend.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §2.3 "business_type"
 */
export const BUSINESS_TYPES = [
  "sports_center",
  "gym",
  "activity_center",
  "club",
  "academy",
  "multi_sport",
] as const;

/** A single business-type identifier (e.g. `"academy"`). */
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Human-readable labels for {@link BusinessType}. */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  sports_center: "Sports Center",
  gym: "Gym",
  activity_center: "Activity Center",
  club: "Club",
  academy: "Academy",
  multi_sport: "Multi-Sport",
};

/**
 * Lifecycle state of an authenticated {@link AuthUser}, backed by
 * `spatie/laravel-model-states` on the backend.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §7 "users.status"
 */
export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "inactive",
  "locked",
  "banned",
] as const;

/** A single user lifecycle state (e.g. `"active"`). */
export type UserStatus = (typeof USER_STATUSES)[number];

/** Human-readable labels for {@link UserStatus}. */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending_verification: "Pending Verification",
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
  locked: "Locked",
  banned: "Banned",
};

/**
 * Generic lifecycle status applied to domain records (students, courses,
 * teams, branches …). Kept deliberately small and separate from
 * {@link UserStatus}, which models the richer identity state machine.
 */
export const ENTITY_STATUSES = ["active", "inactive", "archived", "pending"] as const;

/** A single domain-record status (e.g. `"active"`). */
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

/** Human-readable labels for {@link EntityStatus}. */
export const ENTITY_STATUS_LABELS: Record<EntityStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
  pending: "Pending",
};

/**
 * A member's position within a team. This is an organisational label and is
 * explicitly **not** an RBAC role (roles/permissions come from `/auth/me`).
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §3 "team_members.position"
 */
export const TEAM_POSITIONS = ["head_coach", "assistant_coach", "athlete", "captain"] as const;

/** A single team position (e.g. `"head_coach"`). */
export type TeamPosition = (typeof TEAM_POSITIONS)[number];

/** Human-readable labels for {@link TeamPosition}. */
export const TEAM_POSITION_LABELS: Record<TeamPosition, string> = {
  head_coach: "Head Coach",
  assistant_coach: "Assistant Coach",
  athlete: "Athlete",
  captain: "Captain",
};

/** Skill level shared by students, courses, and teams. */
export const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "elite"] as const;

/** A single skill level (e.g. `"intermediate"`). */
export type SkillLevel = (typeof SKILL_LEVELS)[number];

/** Human-readable labels for {@link SkillLevel}. */
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};
