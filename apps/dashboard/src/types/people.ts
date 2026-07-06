/**
 * @file people.ts
 * @module types/people
 *
 * @description
 * People shapes: the authenticated user, staff accounts, athletes, their
 * per-sport enrollments, guardians, and documents. The athlete's base identity
 * is typed columns; sport-variable data lives on the **enrollment** as dynamic
 * attributes (SDUI), per the blueprint's attribute strategy.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.1 "Athletes"
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.5 "User", §10.18 "Staff & HR"
 */

import type { AttributeHost, BaseModel, TenantScoped } from "@/types/base";
import type {
  EntityStatus,
  Gender,
  SkillLevel,
  StaffEmploymentType,
  StaffStatus,
  TeamPosition,
  UserStatus,
} from "@/types/enums";
import type { TenantSummary } from "@/types/platform";
import type { QuotaHeadline, SubscriptionSummary } from "@/types/subscription";

/**
 * PII satellite of a user (mirrors the backend `profiles` table — redactable
 * under GDPR retention rules).
 */
export interface UserProfile {
  first_name: string;
  last_name: string;
  /** Preferred display name; falls back to `"first last"` server-side. */
  display_name: string;
  avatar_url: string | null;
  /** BCP-47 locale, e.g. `"en"` or `"ar"`. */
  locale: string;
  /** IANA timezone, e.g. `"Africa/Cairo"`. */
  timezone: string;
}

/**
 * The full authenticated user as returned by `GET /api/auth/me` (tenant) or
 * `GET /api/v1/platform/auth/me` (platform). The auth provider condenses this
 * into the leaner {@link "@/types/platform".Identity} for UI consumption.
 *
 * Backend `MeData` shape — see BACKEND_HANDOFF.md §5.1 for the field-by-field
 * contract.
 */
export interface AuthUser extends BaseModel, TenantScoped {
  email: string;
  username: string | null;
  phone: string | null;
  /**
   * User lifecycle. Historically the machine values (`"active"`, `"pending"`),
   * but the backend `MeData` returns the human label from `UserState`
   * (`"Active"`, `"Pending"`, `"Disabled"`). We accept both shapes.
   */
  status: UserStatus | string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  last_login_at: string | null;
  profile: UserProfile;
  /** RBAC roles (raw strings, seeded per business type). */
  roles: string[];
  /** Flat list of effective permission strings; `["*"]` = superuser. */
  permissions: string[];
  /** Feature keys enabled for this tenant. */
  features: string[];
  /** Per-tenant terminology overrides keyed by resource name. */
  terminology: Record<string, string>;
  tenant: TenantSummary;
  /** Other tenants the caller belongs to (cross-tenant switch). */
  tenants?: TenantSummary[];
  /** The caller's accessible scopes (organizations/branches/seasons). */
  scopes?: {
    organizations: Array<{ id: string; name: string; is_default?: boolean }>;
    branches: Array<{
      id: string;
      name: string;
      organization_id: string;
      region_id?: string | null;
      is_default?: boolean;
    }>;
    seasons: Array<{ id: string; name: string; status?: string; is_current?: boolean }>;
  };
  /** Current subscription snapshot, or `null` when unsubscribed. */
  subscription?: SubscriptionSummary | null;
  /** Headline quota rows for the shell. */
  quota_summary?: QuotaHeadline[];
}

/**
 * A staff/admin account row (the `users` resource). Distinct from
 * {@link AuthUser}, which is the *currently authenticated* principal.
 */
export interface User extends BaseModel, TenantScoped {
  email: string;
  username: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string | null;
  status: UserStatus;
  /** RBAC roles (raw strings). */
  roles: string[];
  last_login_at: string | null;
}

/**
 * An internal person (reception, coach, head coach, admin, medical). Owns
 * employment, pay, and status; sport-specific coaching data lives in the
 * Coaching sub-domain as a thin view over this record.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.18 "Staff & HR"
 */
export interface Staff extends BaseModel, TenantScoped {
  /** Backing identity account, if the staff member can sign in. */
  user_id: string | null;
  branch_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  /** Job title, e.g. `"Head Coach"`. */
  title: string;
  employment_type: StaffEmploymentType;
  /** Base pay in minor-unit-avoided decimal string (per period/session). */
  base_pay: string;
  /** ISO-4217 currency for pay. */
  currency: string;
  status: StaffStatus;
  /** ISO-8601 hire date. */
  hired_at: string | null;
}

/**
 * A guardian link between a `parent_guardian` user and an athlete, with consent
 * flags and ordering. A guardian can link to many athletes across branches.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.1 (guardians + consent)
 */
export interface AthleteGuardian extends BaseModel, TenantScoped {
  athlete_id: string;
  /** The guardian's user account. */
  user_id: string;
  /** Relationship label, e.g. `"mother"`, `"father"`, `"guardian"`. */
  relationship: string;
  /** Consent to use the child's photo. */
  consent_photo: boolean;
  /** Consent for medical treatment. */
  consent_medical: boolean;
  /** Consent for transport. */
  consent_transport: boolean;
  /** Display/contact order among a child's guardians (1 = primary). */
  order: number;
}

/**
 * A document attached to an athlete (passport, medical, ID) with expiry
 * tracking. Backed by the Documents module for storage/scan/signed access.
 */
export interface AthleteDocument extends BaseModel, TenantScoped {
  athlete_id: string;
  /** Document kind, e.g. `"passport"`, `"medical_clearance"`. */
  type: string;
  /** Reference to the stored document in the Documents module. */
  document_id: string;
  /** ISO-8601 expiry, or `null` if it never expires. */
  expires_at: string | null;
}

/**
 * A per-sport enrollment of an athlete on a team for a season. This is the
 * primary **attribute host** — football stats vs swimming PBs live in
 * `attributes`, selected by `sport_key` (mechanism #3).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §12.1 (enrollment carries `sport_key`)
 */
export interface AthleteEnrollment extends BaseModel, TenantScoped, AttributeHost {
  athlete_id: string;
  /** Discriminator selecting the sport config + attribute set, e.g. `"football"`. */
  sport_key: string;
  team_id: string | null;
  season_id: string;
  /** Squad role / position within the team, if applicable. */
  squad_role: TeamPosition | null;
  /** Skill level for this enrollment. */
  level: SkillLevel | null;
  status: EntityStatus;
  /** ISO-8601 enrollment timestamp. */
  enrolled_at: string;
}

/**
 * An athlete — the player record and the heart of the parent-facing experience.
 * Base identity is typed; sport-variable data lives on {@link AthleteEnrollment}.
 *
 * The canonical resource name is `athletes`; tenants may display it as
 * "Students"/"Members" via terminology.
 */
export interface Athlete extends BaseModel, TenantScoped {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: EntityStatus;
  /** Home branch the athlete is registered at (enrollments may add more). */
  branch_id: string;
  date_of_birth: string | null;
  gender: Gender | null;
  nationality: string | null;
  /** National ID / passport number, if captured. */
  national_id: string | null;
  /** BCP-47 preferred language. */
  preferred_language: string | null;
  /** Optional link to the central Academorix ID (People module). */
  person_identity_id: string | null;
  /** ISO-8601 first-enrollment timestamp (denormalized for lists). */
  enrolled_at: string;
}
