/**
 * @file branding-boot.ts
 * @module lib/tenancy/branding-boot
 *
 * @description
 * The synchronous pre-paint step that applies cached tenant branding to
 * the DOM before React mounts. Imported and called at the top of `main.tsx`
 * so the first frame the user paints already carries the tenant's brand
 * colors, tab title, and favicon — no FOUC on repeat visits.
 *
 * ## Why this file exists in isolation
 *
 * We want the smallest possible module to run before React. This file is
 * intentionally tiny: it wraps `readCachedBranding` + `applyBrandingToDom`
 * with a central-host guard and a defensive try/catch. It stays lean so
 * the tree-shaker keeps the pre-paint pass under a millisecond of eval time.
 *
 * ## Cache miss = no-op
 *
 * On a fresh visit (or a cache eviction / schema bump / expiry), this
 * function silently returns. The tenancy provider's `useEffect` will fetch
 * `/current-tenant` shortly after and apply the branding then; a brief
 * flash of the default theme is acceptable for first-time visitors.
 *
 * ## Central hosts are skipped
 *
 * The central + central-admin surfaces (workspace picker, admin console)
 * belong to the platform, not a tenant, so we deliberately leave the
 * default theme in place there. This also prevents a mis-cached branding
 * from bleeding into central pages if a user navigates back to
 * `academorix.com` in the same browser session.
 */

import { resolveHostContext } from "@/lib/http";
import { applyBrandingToDom } from "@/lib/tenancy/branding";
import { readCachedBranding } from "@/lib/tenancy/branding-cache";

/**
 * Read the cached branding envelope for the current host and paint it to
 * the DOM synchronously — CSS variables on `<html>`, tab title, favicon.
 *
 * Must be called BEFORE `createRoot(...).render(...)` for the FOUC-free
 * experience. Safe to call in any environment; every failure mode is
 * swallowed so a corrupted cache or a missing `window` can never block
 * the app from booting.
 *
 * Returns `true` when a cached envelope was applied, `false` otherwise —
 * useful for tests and for the tenancy provider's splash-gate heuristic
 * (a hit means we already have a branded surface, so we can render the
 * splash spinner without a color-flash).
 */
export function bootstrapBrandingFromCache(): boolean {
  try {
    const host = resolveHostContext();

    // Central hosts (marketing / workspace picker / admin console) never
    // display tenant branding. Skip the cache lookup entirely to avoid
    // any risk of leaking a stale tenant palette into central surfaces.
    if (host.kind !== "tenant") {
      return false;
    }

    const cached = readCachedBranding(host.hostname);

    if (cached === null) {
      return false;
    }

    applyBrandingToDom(cached.branding, cached.tenantName);

    return true;
  } catch {
    // Defensive: anything the boot step throws would leave the page white.
    // Cache miss + default theme is a strictly better failure mode.
    return false;
  }
}
