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

/**
 * Biological sex / gender recorded on a person. Kept minimal and optional;
 * tenants may extend labels via terminology.
 */
export const GENDERS = ["male", "female", "other"] as const;

/** A single gender value. */
export type Gender = (typeof GENDERS)[number];

/** Human-readable labels for {@link Gender}. */
export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

/**
 * Lifecycle of a {@link Season}. A tenant runs one active season at a time per
 * organization, with future seasons `upcoming` and past ones `closed`/`archived`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §11.3 "Seasons & Registration"
 */
export const SEASON_STATUSES = ["upcoming", "active", "closed", "archived"] as const;

/** A single season status. */
export type SeasonStatus = (typeof SEASON_STATUSES)[number];

/** Human-readable labels for {@link SeasonStatus}. */
export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
};

/**
 * The kind of scheduled activity an {@link Event} represents. The per-sport
 * *display* term (e.g. "Match" vs "Meet") comes from the sport registry
 * terminology, not this enum — this is the structural type.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.1 "Events, Invitations & RSVP"
 */
export const EVENT_TYPES = ["training", "match", "session", "meeting", "other"] as const;

/** A single event type. */
export type EventType = (typeof EVENT_TYPES)[number];

/** Human-readable labels for {@link EventType}. */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: "Training",
  match: "Match",
  session: "Session",
  meeting: "Meeting",
  other: "Other",
};

/**
 * Lifecycle of an {@link Event}. Draft events are coach-authored; head
 * coach/admin approval publishes them (see the role matrix in the blueprint §3).
 */
export const EVENT_STATUSES = [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

/** A single event status. */
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Human-readable labels for {@link EventStatus}. */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * A guardian/athlete's RSVP to an event invitation.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.1
 */
export const RSVP_STATUSES = ["pending", "going", "not_going", "maybe"] as const;

/** A single RSVP status. */
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** Human-readable labels for {@link RsvpStatus}. */
export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "Pending",
  going: "Going",
  not_going: "Not Going",
  maybe: "Maybe",
};

/**
 * A person's attendance mark for a session/event. Captured on the field
 * (offline-capable) then reviewed/confirmed.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.5 "Attendance"
 */
export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

/** A single attendance status. */
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** Human-readable labels for {@link AttendanceStatus}. */
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

/**
 * Lifecycle of a {@link Match}. Mirrors {@link EventStatus} but kept distinct so
 * match-only transitions (e.g. result recording) can diverge later.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §13.3 "Matches"
 */
export const MATCH_STATUSES = [
  "draft",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "postponed",
] as const;

/** A single match status. */
export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Human-readable labels for {@link MatchStatus}. */
export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  postponed: "Postponed",
};

/**
 * How a sport computes a result and awards standings points. Each type maps to
 * a scoring strategy in the sport registry.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §7.1 "Scoring-strategy catalog"
 */
export const SCORING_TYPES = [
  "goals",
  "points",
  "sets",
  "time",
  "distance",
  "height",
  "apparatus",
  "belt",
] as const;

/** A single scoring type. */
export type ScoringType = (typeof SCORING_TYPES)[number];

/** Human-readable labels for {@link ScoringType}. */
export const SCORING_TYPE_LABELS: Record<ScoringType, string> = {
  goals: "Goals",
  points: "Points",
  sets: "Sets",
  time: "Time",
  distance: "Distance",
  height: "Height",
  apparatus: "Apparatus",
  belt: "Belt",
};

/**
 * Lifecycle of a customer {@link Invoice} (money-in / AR).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.3 "Billing & Payments"
 */
export const INVOICE_STATUSES = [
  "draft",
  "open",
  "paid",
  "partially_paid",
  "overdue",
  "void",
  "refunded",
] as const;

/** A single invoice status. */
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Human-readable labels for {@link InvoiceStatus}. */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
  void: "Void",
  refunded: "Refunded",
};

/** Lifecycle of a {@link Payment} attempt against an invoice. */
export const PAYMENT_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

/** A single payment status. */
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Human-readable labels for {@link PaymentStatus}. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  partially_refunded: "Partially Refunded",
};

/**
 * Lifecycle of a recurring {@link Membership}/subscription (academy → member).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.5 "Recurring Membership & Subscriptions"
 */
export const MEMBERSHIP_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
] as const;

/** A single membership status. */
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** Human-readable labels for {@link MembershipStatus}. */
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  paused: "Paused",
  cancelled: "Cancelled",
  expired: "Expired",
};

/**
 * How a {@link Staff} member is employed — drives payroll computation.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.18 "Staff & HR"
 */
export const STAFF_EMPLOYMENT_TYPES = ["salaried", "hourly", "per_session"] as const;

/** A single staff employment type. */
export type StaffEmploymentType = (typeof STAFF_EMPLOYMENT_TYPES)[number];

/** Human-readable labels for {@link StaffEmploymentType}. */
export const STAFF_EMPLOYMENT_TYPE_LABELS: Record<StaffEmploymentType, string> = {
  salaried: "Salaried",
  hourly: "Hourly",
  per_session: "Per Session",
};

/** Lifecycle of a {@link Staff} member. */
export const STAFF_STATUSES = ["onboarding", "active", "on_leave", "offboarded"] as const;

/** A single staff status. */
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** Human-readable labels for {@link StaffStatus}. */
export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
  on_leave: "On Leave",
  offboarded: "Offboarded",
};

/**
 * Category of a money-out {@link Expense}.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.19 "Finance — Expenses"
 */
export const EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "equipment",
  "maintenance",
  "salaries",
  "marketing",
  "other",
] as const;

/** A single expense category. */
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Human-readable labels for {@link ExpenseCategory}. */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  equipment: "Equipment",
  maintenance: "Maintenance",
  salaries: "Salaries",
  marketing: "Marketing",
  other: "Other",
};

/** Lifecycle of an {@link Expense} / payroll run. */
export const EXPENSE_STATUSES = ["draft", "approved", "paid"] as const;

/** A single expense status. */
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

/** Human-readable labels for {@link ExpenseStatus}. */
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
};

/**
 * Status of a polymorphic approval task in the shared approvals queue.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.20 "Reception & Front Desk"
 */
export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

/** A single approval status. */
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/** Human-readable labels for {@link ApprovalStatus}. */
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/**
 * Status of a self-service enrollment/registration in the acquisition funnel.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.4 "Enrollment & Waitlist"
 */
export const REGISTRATION_STATUSES = [
  "lead",
  "trial",
  "offer",
  "enrolled",
  "waitlisted",
  "declined",
] as const;

/** A single registration status. */
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/** Human-readable labels for {@link RegistrationStatus}. */
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  lead: "Lead",
  trial: "Trial",
  offer: "Offer",
  enrolled: "Enrolled",
  waitlisted: "Waitlisted",
  declined: "Declined",
};
