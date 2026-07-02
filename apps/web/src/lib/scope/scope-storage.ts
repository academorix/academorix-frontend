/**
 * @file scope-storage.ts
 * @module lib/scope/scope-storage
 *
 * @description
 * Persistence for the active {@link ActiveScope}, namespaced per tenant so
 * switching tenants doesn't leak the previous tenant's org/branch/season
 * selection. Values are validated by the provider on load; this module only
 * reads/writes JSON and never throws (storage may be unavailable in private
 * mode / SSR-like contexts).
 */

import type { ActiveScope } from "@/lib/scope/scope.types";

/** Storage key prefix; the tenant slug is appended for isolation. */
const STORAGE_PREFIX = "academorix.scope";

/** Builds the tenant-namespaced storage key. */
function storageKey(tenantSlug: string): string {
  return `${STORAGE_PREFIX}.${tenantSlug}`;
}

/**
 * Reads the persisted scope for a tenant, or `null` when absent/unreadable.
 *
 * @param tenantSlug - The active tenant's slug (namespaces the entry).
 */
export function readStoredScope(tenantSlug: string): ActiveScope | null {
  try {
    const raw = window.localStorage.getItem(storageKey(tenantSlug));

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ActiveScope>;

    return {
      organizationId: parsed.organizationId ?? null,
      branchId: parsed.branchId ?? null,
      seasonId: parsed.seasonId ?? null,
    };
  } catch {
    // Corrupt/unavailable storage — fall back to defaults.
    return null;
  }
}

/**
 * Persists the active scope for a tenant. Silently no-ops if storage is
 * unavailable.
 *
 * @param tenantSlug - The active tenant's slug.
 * @param scope - The scope to persist.
 */
export function writeStoredScope(tenantSlug: string, scope: ActiveScope): void {
  try {
    window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(scope));
  } catch {
    // Ignore write failures (quota, disabled storage) — scope stays in memory.
  }
}
