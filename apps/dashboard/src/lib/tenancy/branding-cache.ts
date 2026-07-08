/**
 * @file branding-cache.ts
 * @module lib/tenancy/branding-cache
 *
 * @description
 * Per-hostname localStorage cache of the last successful `TenantBranding`
 * payload, used by {@link "@/lib/tenancy/branding-boot".bootstrapBrandingFromCache}
 * to paint brand colors and favicon synchronously — before React mounts —
 * on every subsequent visit to the same tenant host.
 *
 * ## Why localStorage, not sessionStorage / IndexedDB / cookies
 *
 * - **Cross-tab persistence**: opening a new tab on the same tenant subdomain
 *   should not FOUC. sessionStorage is per-tab.
 * - **Synchronous read**: FOUC prevention needs to happen before the first
 *   paint. IndexedDB's async API can't run inside a synchronous boot script.
 * - **Client-owned**: the payload is public (it's the same JSON any visitor
 *   would receive from `/current-tenant`) so we don't need cookie-level
 *   security or HttpOnly.
 *
 * ## Schema versioning
 *
 * A `v` field on the persisted envelope pins the shape. If we ever change
 * the wire contract (add a required field, change a name, drop a key), we
 * bump {@link CACHE_SCHEMA_VERSION} and every browser silently invalidates
 * on the next boot. Old envelopes get treated as cache misses.
 *
 * ## TTL
 *
 * 24h is the sweet spot: long enough that returning visitors always avoid
 * the FOUC, short enough that a tenant admin who updates the palette sees
 * their change within a day even if they never explicitly log back in.
 * The authoritative refresh still happens on every boot via `/current-tenant`
 * itself — the cache is only there to eliminate the first-paint flash, not
 * to serve stale data.
 */

import type { TenantBranding } from "@/types";

/** localStorage key prefix; per-hostname suffixes are appended verbatim. */
const CACHE_KEY_PREFIX = "academorix:tenant-branding:";

/** Bump this when the persisted envelope shape changes. */
const CACHE_SCHEMA_VERSION = 1;

/** Cache freshness window (24h). */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Persisted envelope stored under `academorix:tenant-branding:<hostname>`.
 * Every field is JSON-serialisable so `JSON.parse(JSON.stringify(x))` is a
 * safe round-trip.
 */
interface CachedBrandingEnvelope {
  /** Schema version — invalidates on mismatch. */
  v: number;
  /** Epoch millis when the entry was written. */
  savedAt: number;
  /** The cached branding payload (nullable — we remember "no branding" too). */
  branding: TenantBranding | null;
  /** Tenant display name for the tab title. */
  tenantName: string;
}

/** Public shape returned by {@link readCachedBranding} on a cache hit. */
export interface CachedBranding {
  /** The cached branding payload, or `null` when the tenant has none. */
  branding: TenantBranding | null;
  /** Tenant display name for the tab title. */
  tenantName: string;
}

/** Compose the localStorage key for a hostname (lowercased for stability). */
function keyFor(hostname: string): string {
  return `${CACHE_KEY_PREFIX}${hostname.toLowerCase()}`;
}

/**
 * Safely access localStorage. Some environments deny access (Safari private
 * mode used to throw on write, some tests inject a stub, SSR has no window)
 * — we treat any failure as a cache miss rather than crash the boot path.
 */
function safeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read a cached branding envelope for the given hostname. Returns `null`
 * when the cache is empty, the schema version doesn't match, the entry has
 * expired, or the persisted JSON is corrupt — every failure mode collapses
 * to the same "no cache" behaviour so callers only have one branch.
 */
export function readCachedBranding(hostname: string): CachedBranding | null {
  const storage = safeStorage();

  if (storage === null) {
    return null;
  }

  const raw = storage.getItem(keyFor(hostname));

  if (raw === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isEnvelope(parsed)) {
    return null;
  }

  if (parsed.v !== CACHE_SCHEMA_VERSION) {
    return null;
  }

  if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
    return null;
  }

  return {
    branding: parsed.branding,
    tenantName: parsed.tenantName,
  };
}

/**
 * Write a fresh branding envelope for the given hostname. Silently swallows
 * localStorage exceptions — the cache is a nice-to-have, never a
 * requirement, so quota-exceeded / permission-denied errors must not break
 * the tenant bootstrap.
 */
export function writeCachedBranding(
  hostname: string,
  branding: TenantBranding | null,
  tenantName: string,
): void {
  const storage = safeStorage();

  if (storage === null) {
    return;
  }

  const envelope: CachedBrandingEnvelope = {
    v: CACHE_SCHEMA_VERSION,
    savedAt: Date.now(),
    branding,
    tenantName,
  };

  try {
    storage.setItem(keyFor(hostname), JSON.stringify(envelope));
  } catch {
    // Quota / permission errors are non-fatal; the app boots without the
    // cached palette and the next successful fetch still writes an entry.
  }
}

/**
 * Clear a cached envelope for the given hostname. Useful when the tenant
 * admin updates their palette in-session — the same tab writes a fresh
 * envelope via `writeCachedBranding`, but sibling tabs will still see
 * stale colors on their next reload until they refetch. Not currently
 * called by any hot path; exposed for admin/preview flows.
 */
export function clearCachedBranding(hostname: string): void {
  const storage = safeStorage();

  if (storage === null) {
    return;
  }

  try {
    storage.removeItem(keyFor(hostname));
  } catch {
    // Non-fatal — the entry expires on its own within 24h.
  }
}

/** Type guard for the persisted envelope shape. */
function isEnvelope(value: unknown): value is CachedBrandingEnvelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const envelope = value as Record<string, unknown>;

  return (
    typeof envelope.v === "number" &&
    typeof envelope.savedAt === "number" &&
    typeof envelope.tenantName === "string" &&
    // `branding` is either a plain object (the payload) or null.
    (envelope.branding === null ||
      (typeof envelope.branding === "object" && envelope.branding !== null))
  );
}
