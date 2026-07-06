/**
 * @file fixtures.ts
 * @module test/fixtures
 *
 * @description
 * Small typed factory helpers for building domain objects in unit tests. Each
 * factory returns a valid default that a test overrides only where it matters,
 * so a test states just the fields under scrutiny (e.g. `permissions`) and
 * ignores the rest. Shared by the auth/session/access-control specs.
 *
 * This is a test helper, not a spec: it lives under `src/test/` and does not
 * match the `*.{test,spec}` glob, so Vitest never runs it as a suite.
 */

import type { ActiveScope } from "@/lib/scope";
import type { AuthUser, Identity, TenantSummary, UserProfile } from "@/types";

/** A reusable tenant summary shared by the identity/user factories. */
const TENANT: TenantSummary = {
  id: "tenant-1",
  slug: "elite",
  name: "Elite Academy",
  business_type: "academy",
  branding: null,
};

/** Builds a {@link UserProfile}, overriding any fields the test cares about. */
export function makeUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    first_name: "Jane",
    last_name: "Doe",
    display_name: "Jane Doe",
    avatar_url: null,
    locale: "en",
    timezone: "Africa/Cairo",
    ...overrides,
  };
}

/** Builds a full {@link AuthUser} (the `/auth/me` contract) with sane defaults. */
export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    email: "jane@example.com",
    username: null,
    phone: null,
    status: "active",
    email_verified_at: null,
    phone_verified_at: null,
    last_login_at: null,
    profile: makeUserProfile(),
    roles: ["coach"],
    permissions: ["athletes.viewAny"],
    features: [],
    terminology: {},
    tenant: TENANT,
    ...overrides,
  };
}

/**
 * Builds a UI-facing {@link Identity}. Permissions default to empty so a test
 * that omits them exercises the "unknown / bootstrap" path deliberately.
 */
export function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    id: "user-1",
    name: "Jane Doe",
    email: "jane@example.com",
    avatar_url: null,
    initials: "JD",
    roles: ["coach"],
    permissions: [],
    features: [],
    terminology: {},
    tenant: TENANT,
    tenants: [TENANT],
    scopes: { organizations: [], branches: [], seasons: [] },
    subscription: null,
    quota_summary: [],
    ...overrides,
  };
}

/** Builds an {@link ActiveScope} stub for the scope-injecting payload builders. */
export function makeScope(overrides: Partial<ActiveScope> = {}): ActiveScope {
  return {
    organizationId: null,
    branchId: null,
    seasonId: null,
    ...overrides,
  };
}
