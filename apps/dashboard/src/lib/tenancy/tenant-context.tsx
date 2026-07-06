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
 * host-resolved, no auth needed). If the endpoint 404s (fixture missing, mock
 * mode, or a misconfigured DNS entry), we log a warning and continue with
 * `tenant: null` so the app still boots.
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { TenancyContextValue, TenantWorkspace } from "@/lib/tenancy/tenancy.types";
import type { ReactNode } from "react";

import { env } from "@/config/env";
import { ApiError, httpClient, resolveHostContext } from "@/lib/http";

/**
 * React context for the tenancy layer. `undefined` outside a provider so
 * consumers can throw a clear error rather than seeing a silent `null`.
 */
const TenancyContext = createContext<TenancyContextValue | undefined>(undefined);

/**
 * Fetches the tenant currently hosting this request from the backend's public
 * `GET /api/current-tenant` endpoint. In mock mode we read `/data/tenant.json`
 * as a fallback (fixture‑backed dev boot).
 */
async function fetchTenantWorkspace(): Promise<TenantWorkspace | null> {
  // Mock mode: fixture is the source of truth.
  if (env.VITE_API_MOCK) {
    try {
      const response = await fetch("/data/tenant.json");

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as TenantWorkspace | { data: TenantWorkspace };

      return "data" in payload ? payload.data : payload;
    } catch {
      return null;
    }
  }

  // Real backend: public endpoint served on the tenant host.
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

  useEffect(() => {
    if (skipFetch) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchTenantWorkspace();

        if (!cancelled) {
          setTenant(result);
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
  }, [skipFetch]);

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

  return <TenancyContext.Provider value={value}>{children}</TenancyContext.Provider>;
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
