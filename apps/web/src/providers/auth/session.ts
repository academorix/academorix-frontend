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
 * Extends the base identity cache with **impersonation state** — a platform
 * admin acting as a tenant user carries an extra impersonation flag + admin
 * summary so the shell can render the "You are viewing X as Y" banner (see
 * PLAN.md §9.7). The impersonation state persists to `sessionStorage` (not
 * `localStorage`) so it dies with the tab, matching the short‑lived token TTL.
 *
 * This is deliberately module-scoped state, not React state: providers are
 * plain objects created outside the component tree, and Refine already mirrors
 * identity into React Query for the UI.
 */

import type { Identity } from "@/types";

/** The cached identity for this session, or `null` when signed out. */
let currentIdentity: Identity | null = null;

/** The current impersonation state, or `null` when acting as self. */
let currentImpersonation: ImpersonationState | null = null;

/** Storage key for the impersonation state (session-scoped by design). */
const IMPERSONATION_STORAGE_KEY = "academorix.auth.impersonation";

/** Impersonation context captured when a platform admin acts as a tenant user. */
export interface ImpersonationState {
  /** Compact admin who initiated the impersonation session. */
  admin: {
    id: string;
    name: string;
    email: string;
  };
  /** ISO-8601 timestamp when the impersonation token expires. */
  expiresAt: string | null;
}

/** Best-effort read of the persisted impersonation state (may be absent). */
function readImpersonation(): ImpersonationState | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    const raw = window.sessionStorage.getItem(IMPERSONATION_STORAGE_KEY);

    return raw ? (JSON.parse(raw) as ImpersonationState) : null;
  } catch {
    return null;
  }
}

/** Persists (or clears) the impersonation state. */
function writeImpersonation(state: ImpersonationState | null): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return;
    }

    if (state) {
      window.sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(state));
    } else {
      window.sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    }
  } catch {
    // Storage may be blocked; the in-memory copy remains authoritative.
  }
}

// Hydrate from storage on load so a page reload during an impersonation
// session shows the banner immediately.
currentImpersonation = readImpersonation();

/** Stores (or clears, with `null`) the current identity. */
export function setCurrentIdentity(identity: Identity | null): void {
  currentIdentity = identity;

  // Sign-out drops any impersonation memory too.
  if (identity === null) {
    setImpersonation(null);
  }
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

/** Whether the caller is currently impersonating another user. */
export function isImpersonating(): boolean {
  return currentImpersonation !== null;
}

/** Returns the active impersonation state, or `null` when acting as self. */
export function getImpersonation(): ImpersonationState | null {
  return currentImpersonation;
}

/** Stores (or clears, with `null`) the impersonation state. */
export function setImpersonation(state: ImpersonationState | null): void {
  currentImpersonation = state;
  writeImpersonation(state);
}
