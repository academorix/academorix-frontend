/**
 * @file session.ts
 * @module providers/auth/session
 *
 * @description
 * A tiny in-memory cache of the currently authenticated {@link Identity},
 * shared by the auth provider (which populates it) and the access-control
 * provider (which reads permissions from it). Keeping one source of truth
 * avoids redundant `/me` fetches and guarantees auth + authorization always
 * agree on who the user is.
 *
 * This is deliberately module-scoped state, not React state: providers are
 * plain objects created outside the component tree, and Refine already mirrors
 * identity into React Query for the UI.
 */

import type { Identity } from "@/types";

/** The cached identity for this session, or `null` when signed out. */
let currentIdentity: Identity | null = null;

/** Stores (or clears, with `null`) the current identity. */
export function setCurrentIdentity(identity: Identity | null): void {
  currentIdentity = identity;
}

/** Returns the cached identity, or `null` when unknown/signed out. */
export function getCurrentIdentity(): Identity | null {
  return currentIdentity;
}

/** Returns the cached permission strings (empty when unknown/signed out). */
export function getCurrentPermissions(): string[] {
  return currentIdentity?.permissions ?? [];
}

/**
 * Whether the current identity holds a given permission. A `"*"` wildcard in
 * the permission set (used by owner/admin) grants everything.
 */
export function hasPermission(permission: string): boolean {
  const permissions = getCurrentPermissions();

  return permissions.includes("*") || permissions.includes(permission);
}

/** Returns the enabled feature keys (empty when unknown/signed out). */
export function getCurrentFeatures(): string[] {
  return currentIdentity?.features ?? [];
}

/**
 * Whether a feature is enabled for the current tenant. Returns `true` when the
 * feature is unspecified or the feature set is unknown (fail-open during
 * bootstrap), and only hides an item when a non-empty feature set omits the key.
 */
export function hasFeature(feature?: string): boolean {
  if (!feature) {
    return true;
  }

  const features = getCurrentFeatures();

  if (features.length === 0) {
    return true;
  }

  return features.includes(feature);
}

/** Resolves a resource's tenant-specific label, falling back to the default. */
export function resolveResourceLabel(resourceName: string, fallback: string): string {
  return currentIdentity?.terminology?.[resourceName] ?? fallback;
}
