/**
 * @file tenant-context.tsx
 * @module lib/tenancy/tenant-context
 *
 * @description
 * Loads and exposes the tenant currently hosting this browser session (see
 * PLAN.md §3.1 for the Slack-style host model). Mounted at the top of the app
 * so every page — public or authenticated — knows the workspace context and
 * can apply branding + labels before the first `<Refine>` render.
 *
 * On a **central** or **central-admin** host, the provider skips the bootstrap
 * request and exposes `tenant: null`.
 *
 * On a **tenant** host, the provider calls `GET /api/current-tenant` (public,
 * host-resolved, no auth needed). If the endpoint 404s (misconfigured DNS
 * entry mapping to no tenant), we log a warning and continue with
 * `tenant: null` so the app still boots.
 *
 * ## Branding side-effects
 *
 * When the fetch resolves with a real tenant, the provider hands the
 * `branding` + `name` off to {@link applyBrandingToDom} — writing the accent
 * CSS variable on `<html>`, updating the tab title, and swapping the
 * favicon — then {@link writeCachedBranding} persists the payload in
 * `localStorage` so the next boot on the same host can paint the palette
 * synchronously (see `branding-boot.ts`). Both side-effects are safe to
 * call repeatedly.
 */

import { Spinner } from "@academorix/ui/react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { TenancyContextValue, TenantWorkspace } from "@/lib/tenancy/tenancy.types";
import type { ReactNode } from "react";

import { ApiError, httpClient, resolveHostContext } from "@/lib/http";
import { applyBrandingToDom } from "@/lib/tenancy/branding";
import { writeCachedBranding } from "@/lib/tenancy/branding-cache";
import { TenantNotFoundPage } from "@/lib/tenancy/tenant-not-found";

/**
 * Grace period before a spinner is shown while the boot request is in
 * flight. Anything below ~300 ms feels instantaneous to the user and a
 * spinner would just flash — the number matches the classic
 * "unnoticeable-delay" threshold.
 */
const SPLASH_GRACE_MS = 300;

/**
 * React context for the tenancy layer. `undefined` outside a provider so
 * consumers can throw a clear error rather than seeing a silent `null`.
 */
const TenancyContext = createContext<TenancyContextValue | undefined>(undefined);

/**
 * Fetches the tenant currently hosting this request from the backend's public
 * `GET /api/current-tenant` endpoint (host-resolved by the `tenant`
 * middleware group; no bearer token required).
 */
async function fetchTenantWorkspace(): Promise<TenantWorkspace | null> {
  try {
    const response = await httpClient.get<TenantWorkspace | { data: TenantWorkspace }>(
      "/current-tenant",
    );

    return "data" in response ? response.data : response;
  } catch (error) {
    // A 404 on a tenant host means "the host doesn't map to a tenant" — a
    // misconfiguration, not a user-visible error. Log for diagnostics; keep
    // the app running with `tenant: null`.
    if (error instanceof ApiError && error.statusCode === 404) {
      // eslint-disable-next-line no-console
      console.warn("Host does not resolve to a tenant (GET /current-tenant returned 404).");

      return null;
    }

    throw error;
  }
}

/** Props for {@link TenancyProvider}. */
interface TenancyProviderProps {
  children: ReactNode;
}

/**
 * Boots the tenancy layer for the current host. Wrap the entire tree so both
 * public pages (login, workspace picker) and authenticated pages have access.
 */
export function TenancyProvider({ children }: TenancyProviderProps): ReactNode {
  const host = useMemo(() => resolveHostContext(), []);

  // On a central host we don't have a tenant workspace to load.
  const skipFetch = host.kind !== "tenant";

  const [tenant, setTenant] = useState<TenantWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // While the boot fetch is in flight, wait `SPLASH_GRACE_MS` before
  // rendering a spinner so fast responses (< 300 ms — LAN, warm cache,
  // sw-cache hits) never flash a loading state at the user.
  useEffect(() => {
    if (skipFetch || !isLoading) {
      setShowSplash(false);

      return;
    }

    const timer = window.setTimeout(() => {
      setShowSplash(true);
    }, SPLASH_GRACE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [skipFetch, isLoading]);

  useEffect(() => {
    if (skipFetch) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchTenantWorkspace();

        if (cancelled) {
          return;
        }

        setTenant(result);

        // Paint the freshly-fetched brand onto `<html>` (accent + focus
        // vars, title, favicon) and cache it under this hostname so the
        // next boot renders the branded surface synchronously before
        // React mounts. Both no-op safely on non-tenant paths (which we
        // already short-circuit above via `skipFetch`).
        if (result !== null) {
          applyBrandingToDom(result.branding, result.name);
          writeCachedBranding(host.hostname, result.branding, result.name);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error("Failed to load tenant."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skipFetch, host.hostname]);

  const value = useMemo<TenancyContextValue>(
    () => ({
      host,
      tenant,
      isLoading,
      error,
      isCentral: host.kind === "central" || host.kind === "central-admin",
      isCentralAdmin: host.kind === "central-admin",
      isTenant: host.kind === "tenant" && tenant !== null,
    }),
    [host, tenant, isLoading, error],
  );

  // Render decision — only applies on tenant hosts, since central + admin
  // never wait for a tenant to load. On tenant hosts we gate on three
  // discrete outcomes of the boot request:
  //
  //   1. Still loading past the grace period → splash spinner (below the
  //      grace threshold we return null and let the browser paint the
  //      cached/default background, avoiding a sub-300 ms flash).
  //   2. Fetch resolved with no tenant → dedicated "workspace not found"
  //      page with a CTA back to the central host.
  //   3. Everything else (loaded, error, or below grace) → render the tree
  //      normally; consumers read the context to decide their own UX.
  let content: ReactNode = children;

  if (host.kind === "tenant") {
    if (isLoading) {
      content = showSplash ? <TenancySplash /> : null;
    } else if (tenant === null && error === null) {
      content = <TenantNotFoundPage />;
    }
  }

  return <TenancyContext.Provider value={value}>{content}</TenancyContext.Provider>;
}

/**
 * Full-viewport neutral spinner used as the loading gate on tenant hosts.
 * Deliberately unlabelled — the surrounding surface already carries the
 * tenant's branded background (either from the localStorage pre-paint or
 * the shell's default theme).
 */
function TenancySplash(): ReactNode {
  return (
    <div aria-busy="true" aria-live="polite" className="flex min-h-dvh items-center justify-center">
      <Spinner aria-label="Loading workspace" size="lg" />
    </div>
  );
}

/**
 * Reads the tenancy context. Throws when used outside a {@link TenancyProvider}
 * to prevent silently-null bugs in a component tree that forgets to mount it.
 */
export function useTenancy(): TenancyContextValue {
  const context = useContext(TenancyContext);

  if (!context) {
    throw new Error("useTenancy must be used within a <TenancyProvider>.");
  }

  return context;
}
