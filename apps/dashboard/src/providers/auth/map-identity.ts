/**
 * @file map-identity.ts
 * @module providers/auth/map-identity
 *
 * @description
 * Pure helpers shared by the REST and mock auth providers for turning the raw
 * user contract into the lean, UI-facing {@link Identity}.
 *
 * Two entry points cover the two shapes the backend emits:
 *
 * - {@link toIdentity} maps the **rich** `AuthUser` from `GET /api/v1/auth/me`
 *   (or the mock `demo-users.json` fixture) — the complete identity with
 *   roles/permissions/features/terminology/tenants/scopes.
 * - {@link synthesizeIdentityFromMinimalUser} builds a best-effort identity
 *   from the **minimal** login DTO the backend returns today (`BackendUserData`
 *   — id/name/email/status only). Used as a bootstrap fallback until PLAN.md
 *   gap G1 (`/me` endpoint) lands, so the shell renders correctly the moment
 *   the user signs in without waiting on a second endpoint.
 */

import type { BackendUserData } from "@/types";
import type { AuthUser, Identity, TenantSummary, UserProfile } from "@/types";

/**
 * Derives up-to-two-letter uppercase initials for an avatar fallback, e.g.
 * `{ first_name: "Jane", last_name: "Doe" }` → `"JD"`. Falls back to the
 * display name's first character when name parts are missing.
 */
export function computeInitials(profile: UserProfile): string {
  const first = profile.first_name?.trim()?.[0] ?? "";
  const last = profile.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return (profile.display_name?.trim()?.[0] ?? "?").toUpperCase();
}

/**
 * Same computation but from a single name string (used by the minimal-user
 * bootstrap where we do not have a separate first/last).
 */
export function computeInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const lastPart = parts.length > 1 ? parts[parts.length - 1] : undefined;
  const last = lastPart?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  return initials || "?";
}

/**
 * Condenses a full {@link AuthUser} into the {@link Identity} the app shell
 * renders (name, avatar, roles, permissions, tenant, scopes, subscription
 * snapshot, and quota headlines). Drops PII the UI does not need.
 *
 * `tenants` and `scopes` back the workspace/organization/branch/season
 * switchers; when the backend omits them (older payloads) we default to the
 * single active tenant and empty scope lists so the shell still renders.
 *
 * `subscription` is the `SubscriptionSummary` (or `null` for tenants who
 * haven't checked out yet). `quota_summary` is capped at 3-5 headline rows —
 * unlimited grants are stripped by the backend, so an empty array simply
 * means no metered grants apply.
 */
export function toIdentity(user: AuthUser): Identity {
  const fullName = `${user.profile.first_name} ${user.profile.last_name}`.trim();
  const name = user.profile.display_name || fullName || user.email;

  return {
    id: user.id,
    name,
    email: user.email,
    avatar_url: user.profile.avatar_url,
    initials: computeInitials(user.profile),
    roles: user.roles,
    permissions: user.permissions,
    features: user.features,
    terminology: user.terminology,
    tenant: user.tenant,
    tenants: user.tenants ?? [user.tenant],
    scopes: user.scopes ?? { organizations: [], branches: [], seasons: [] },
    subscription: user.subscription ?? null,
    quota_summary: user.quota_summary ?? [],
  };
}

/**
 * Builds a best-effort {@link Identity} from the minimal login DTO. The
 * shell renders (identified user + tenant), but nav items and RBAC-gated
 * actions stay hidden until the richer `/me` payload lands.
 *
 * When {@link tenant} is `null` (unknown at login time), the caller supplies a
 * placeholder tenant summary so downstream code that reads `identity.tenant`
 * does not crash. On a tenant host, the placeholder is filled by
 * {@link "@/lib/tenancy" TenancyProvider} from `GET /current-tenant` a few
 * moments later.
 *
 * @param user - The minimal user returned by the login DTO.
 * @param tenant - The current tenant workspace, or a placeholder.
 */
export function synthesizeIdentityFromMinimalUser(
  user: BackendUserData,
  tenant: TenantSummary,
): Identity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: null,
    initials: computeInitialsFromName(user.name),
    // Empty by design: without `/me` we do not know these values. The shell
    // treats an empty features list as "fail-open" during bootstrap, so the
    // user still sees a working (if unfiltered) UI until the real payload
    // arrives.
    roles: [],
    permissions: [],
    features: [],
    terminology: {},
    tenant,
    tenants: [tenant],
    scopes: { organizations: [], branches: [], seasons: [] },
    subscription: null,
    quota_summary: [],
  };
}

/**
 * Placeholder tenant summary used when the login response arrives before the
 * tenancy layer has fetched the real one. The `slug` mirrors what the host
 * resolver derived from the URL, so the shell knows which workspace we are on.
 */
export function placeholderTenantSummary(slug: string | null, name: string): TenantSummary {
  return {
    id: "pending",
    slug: slug ?? "workspace",
    name,
    business_type: "sports_center",
    branding: { logo_url: null, primary_color: null, favicon_url: null },
  };
}
