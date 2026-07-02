/**
 * @file map-identity.ts
 * @module providers/auth/map-identity
 *
 * @description
 * Pure helpers shared by the REST and mock auth providers for turning the raw
 * {@link AuthUser} server contract into the lean, UI-facing {@link Identity}.
 * Centralising this keeps both providers behaviourally identical.
 */

import type { AuthUser, Identity, UserProfile } from "@/types";

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
 * Condenses a full {@link AuthUser} into the {@link Identity} the app shell
 * renders (name, avatar, roles, permissions, tenant). Drops PII the UI does
 * not need.
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
  };
}
