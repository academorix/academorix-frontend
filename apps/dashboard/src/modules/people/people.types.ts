/**
 * @file people.types.ts
 * @module modules/people/people.types
 *
 * @description
 * Module-local shapes for the **People** identity ledger — the cross-tenant
 * global identity ("Academorix ID") that links a person's profiles across
 * academies. A `Person` is owned by the platform (not any single tenant);
 * each tenant that interacts with the person creates a `PersonProfile`
 * projection (athlete profile, coach profile, staff profile, guardian
 * profile).
 *
 * TODO(backend-endpoint): a real People module does not exist in the backend
 * yet. Shapes below are best-guess based on
 * `DOMAIN_MODULES_BLUEPRINT.md §10.17`. Once the backend ships, replace this
 * synthetic type surface with the generated OpenAPI types from
 * `@/lib/api/schema`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.17 "People & Global Identity"
 */

import type { BaseModel } from "@/types";

/** The set of roles a person can hold within a single tenant. */
export const ROLES_IN_TENANT = ["athlete", "coach", "staff", "guardian"] as const;

/** A single role a person plays in a tenant (e.g. `"athlete"`). */
export type RoleInTenant = (typeof ROLES_IN_TENANT)[number];

/** Human-readable labels for {@link RoleInTenant}. */
export const ROLE_IN_TENANT_LABELS: Record<RoleInTenant, string> = {
  athlete: "Athlete",
  coach: "Coach",
  staff: "Staff",
  guardian: "Guardian",
};

/** The set of lifecycle states a per-tenant profile can be in. */
export const PROFILE_STATUSES = ["active", "inactive"] as const;

/** A single per-tenant profile status. */
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Human-readable labels for {@link ProfileStatus}. */
export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

/**
 * A per-tenant projection of a {@link Person} — how a single academy sees this
 * person (as an athlete, coach, staff member, or guardian). The `profile_id`
 * points to the id of the tenant-scoped resource (an `athletes.id`,
 * `staff.id`, or `users.id`); the shape of that resource depends on
 * `role_in_tenant`.
 */
export interface PersonProfile extends BaseModel {
  /** Foreign key to the parent {@link Person}. */
  person_id: string;
  /** Owning tenant (never null — this is where the person "shows up"). */
  tenant_id: string;
  /** Optional convenience label for the tenant (denormalised for the UI). */
  tenant_name?: string;
  /** Which role this projection represents. */
  role_in_tenant: RoleInTenant;
  /** Id of the tenant-scoped record (athlete/coach/staff/guardian). */
  profile_id: string;
  /** Whether this projection is currently active in the tenant. */
  status: ProfileStatus;
}

/**
 * A record of a merge operation applied to a {@link Person}. Emitted by the
 * platform-admin merge endpoint so an operator can audit dedup history and
 * (in future) revert a bad merge.
 */
export interface PersonMerge extends BaseModel {
  /** The surviving (target) person id. */
  person_id: string;
  /** The person id that was merged in and retired. */
  merged_from_person_id: string;
  /** Identity of the platform admin who performed the merge. */
  merged_by: string;
  /** Free-text merge note (why the merge was performed). */
  note: string | null;
}

/**
 * A **Person** — the globally-unique identity record (the Academorix ID).
 *
 * Owned by the platform, not any single tenant. Each tenant that interacts
 * with the person creates a {@link PersonProfile}. Merges happen at this
 * level (see {@link PersonMerge}).
 *
 * The `id` is a ULID, chosen so it sorts lexicographically by creation time
 * — a small quality-of-life win for platform admins browsing the ledger.
 */
export interface Person extends BaseModel {
  /**
   * Preferred contact email (may be null when the person only exists via a
   * guardian projection).
   */
  primary_email: string | null;
  /** Preferred contact phone (E.164). */
  primary_phone: string | null;
  /** Display name, e.g. `"Jordan Reyes"`. */
  full_name: string;
  avatar_url: string | null;
  /** ISO-8601 date-of-birth, or `null` when unknown. */
  dob: string | null;
  /** Gender, or `null` when unknown. */
  gender: "male" | "female" | "other" | null;
  /** ISO 3166-1 alpha-2 country code, or `null` when unknown. */
  nationality: string | null;
  /** BCP-47 language tags the person is comfortable in, e.g. `["en","ar"]`. */
  languages: string[];
  /**
   * External integration identifiers, keyed by system name. Example:
   * `{ stripe: "cus_...", mailchimp: "sub_...", intercom: "..." }`.
   * Empty when no integrations have been linked yet.
   */
  external_ids: Record<string, string>;
  /** Per-tenant projections of this person, sorted newest-first. */
  profiles?: PersonProfile[];
  /** History of merges applied to this person, sorted newest-first. */
  merges?: PersonMerge[];
}
