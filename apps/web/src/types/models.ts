/**
 * @file models.ts
 * @module types/models
 *
 * @description
 * TypeScript shapes for every domain entity the frontend reads or writes.
 *
 * ## Naming convention
 * Fields use **snake_case** on purpose: they mirror, verbatim, the JSON that
 * Laravel API Resources emit. Keeping the client shape identical to the server
 * shape means the JSON-file mock (`public/data/*.json`) and the real REST API
 * are byte-for-byte interchangeable — flipping `VITE_API_MOCK` never changes a
 * single field name. This avoids a fragile camel/snake transformation layer
 * that would inevitably drift between mock and production.
 *
 * ## Timestamps
 * All timestamps are ISO-8601 strings (as serialised by Laravel), never
 * `Date` objects — JSON has no date type, and keeping them as strings keeps
 * the models trivially serialisable.
 */

import type {
  BusinessType,
  EntityStatus,
  SkillLevel,
  TeamPosition,
  UserStatus,
} from "@/types/enums";

/**
 * Common columns present on every persisted record. Every domain model
 * extends this so list/table code can rely on `id`, `created_at`, and
 * `updated_at` existing.
 *
 * `id` is a string because the backend uses UUID primary keys
 * (see the tenancy spec). Refine's `BaseKey` accepts `string | number`,
 * so a string id slots straight into every Refine hook.
 */
export interface BaseModel {
  /** UUID primary key. */
  id: string;
  /** ISO-8601 creation timestamp. */
  created_at: string;
  /** ISO-8601 last-update timestamp. */
  updated_at: string;
}

/**
 * A record that belongs to a tenant. Almost every domain model is
 * tenant-scoped (row-level multi-tenancy via `tenant_id`).
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §2 "Tenancy"
 */
export interface TenantScoped {
  /** Owning tenant's UUID. */
  tenant_id: string;
}

/**
 * Compact tenant descriptor embedded in the authenticated user's identity.
 * The full tenant record lives behind its own endpoint; this is just what the
 * shell needs to render branding and pick terminology.
 */
export interface TenantSummary {
  id: string;
  /** Subdomain slug, e.g. `"riverside"` in `riverside.academorix.app`. */
  slug: string;
  name: string;
  business_type: BusinessType;
}

/**
 * PII satellite of a user. Mirrors the backend `profiles` table (a redactable
 * table under GDPR retention rules).
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
 * The full authenticated user as returned by `GET /api/auth/me`.
 *
 * This is the raw server contract. The auth provider condenses it into the
 * leaner {@link Identity} for UI consumption (see `getIdentity`).
 */
export interface AuthUser extends BaseModel, TenantScoped {
  email: string;
  username: string | null;
  phone: string | null;
  status: UserStatus;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  last_login_at: string | null;
  profile: UserProfile;
  /**
   * RBAC roles held by the user, as raw strings from the backend. Not a fixed
   * frontend union — roles are data, seeded per `business_type`.
   */
  roles: string[];
  /** Flat list of effective permission strings, e.g. `"athletes.create"`. `["*"]` = superuser. */
  permissions: string[];
  /**
   * Feature keys enabled for this tenant/`business_type` (feature toggles /
   * entitlements). The frontend hides modules whose `featureKey` is absent.
   */
  features: string[];
  /**
   * Per-tenant terminology overrides, keyed by canonical resource name
   * (e.g. `{ athletes: "Students" }`). Overrides a resource's default label.
   */
  terminology: Record<string, string>;
  tenant: TenantSummary;
}

/**
 * UI-facing identity derived from {@link AuthUser} by the auth provider.
 * Everything the app shell needs to render "who is signed in" and to gate
 * navigation, with no PII beyond what the header shows.
 */
export interface Identity {
  id: string;
  /** Display name shown in the navbar / sidebar footer. */
  name: string;
  email: string;
  avatar_url: string | null;
  /** Uppercase initials for the avatar fallback, e.g. `"JD"`. */
  initials: string;
  /** RBAC roles (raw strings). */
  roles: string[];
  /** Effective permission strings; `["*"]` = superuser. */
  permissions: string[];
  /** Enabled feature keys for this tenant. */
  features: string[];
  /** Per-tenant terminology overrides keyed by resource name. */
  terminology: Record<string, string>;
  tenant: TenantSummary;
}

/**
 * A staff/admin account row (the `users` resource). Distinct from
 * {@link AuthUser}, which is the *currently authenticated* principal with its
 * embedded profile, tenant, and permissions.
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
 * An athlete enrolled at the academy — the flagship domain resource. (Some
 * business types display these as "Students" or "Members" via tenant
 * terminology; the canonical resource name stays `athletes`.)
 */
export interface Athlete extends BaseModel, TenantScoped {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: EntityStatus;
  /** Branch (physical venue) the athlete is registered at. */
  branch_id: string;
  /** Team/squad the athlete belongs to, if any. */
  team_id: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
  level: SkillLevel | null;
  /** ISO-8601 enrolment timestamp. */
  enrolled_at: string;
}

/**
 * A coach / instructor. `user_id` links to the backing identity account when
 * the coach can also sign in.
 */
export interface Coach extends BaseModel, TenantScoped {
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: EntityStatus;
  branch_id: string;
  /** Primary discipline/sport, e.g. `"Swimming"`. */
  discipline: string;
  /** Default position when assigned to a team. */
  position: TeamPosition;
  /** Years of professional coaching experience. */
  years_experience: number;
}

/**
 * A course / program offered at a branch, taught by a coach.
 */
export interface Course extends BaseModel, TenantScoped {
  name: string;
  description: string;
  discipline: string;
  level: SkillLevel;
  status: EntityStatus;
  branch_id: string;
  coach_id: string;
  /** Maximum number of enrolled students. */
  capacity: number;
  /** Current number of enrolled students. */
  enrolled_count: number;
  start_date: string;
  end_date: string | null;
  /** Price in minor units is avoided; this is a decimal string from Laravel. */
  price: string;
  /** ISO-4217 currency code, e.g. `"USD"`. */
  currency: string;
}

/**
 * A team / squad / class group at a branch.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §3 "teams"
 */
export interface Team extends BaseModel, TenantScoped {
  name: string;
  description: string | null;
  branch_id: string;
  discipline: string;
  /** Free-text age band, e.g. `"U12"`. */
  age_group: string;
  level: SkillLevel;
  status: EntityStatus;
  lead_coach_id: string | null;
  members_count: number;
}

/**
 * A branch — a physical venue belonging to an organisation.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §3 "branches"
 */
export interface Branch extends BaseModel, TenantScoped {
  organization_id: string;
  region_id: string | null;
  name: string;
  slug: string;
  status: EntityStatus;
  city: string;
  country: string;
  /** IANA timezone for the venue. */
  timezone: string;
  /** Maximum simultaneous occupancy. */
  capacity: number;
  contact_email: string | null;
  contact_phone: string | null;
  is_default: boolean;
}
