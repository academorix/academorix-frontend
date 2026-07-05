/**
 * @file use-entitlements.ts
 * @module modules/entitlements/hooks/use-entitlements
 *
 * @description
 * Read hook for `GET /api/entitlements/usage` — the **full** entitlement
 * matrix behind the identity's 3-5 headline rows. Returned rows carry
 * `{key, label, type, used, limit, is_unlimited}` so pages can render every
 * grant the tenant's plan includes, not just the metered ones.
 *
 * The endpoint is a single RPC, not a Refine CRUD resource, so we call
 * {@link httpClient} directly and expose the standard three-state shape.
 *
 * @see BACKEND_HANDOFF.md §5.5 (`GET /api/entitlements/usage`)
 */

import { useCallback, useEffect, useState } from "react";

import type { EntitlementUsage } from "@/types";

import { httpClient, unwrapEnvelope } from "@/lib/http";

/** State emitted by {@link useEntitlementsUsage}. */
export interface EntitlementsUsageResult {
  /** The full entitlement matrix, or `null` while loading / on error. */
  data: EntitlementUsage[] | null;
  /** True while the initial (or refetch) request is in flight. */
  isLoading: boolean;
  /** Any error thrown by the underlying fetch. */
  error: Error | null;
  /** Force-refetch the current query. */
  refetch: () => Promise<void>;
}

/**
 * Fetches every entitlement + current-usage row for the active tenant.
 * Empty array is a valid response (freshly-provisioned tenants have no grants
 * yet); the page should render an empty state rather than a spinner.
 */
export function useEntitlementsUsage(): EntitlementsUsageResult {
  const [data, setData] = useState<EntitlementUsage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNow = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await httpClient.get<unknown>("/entitlements/usage");

      setData(unwrapEnvelope<EntitlementUsage[]>(raw));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNow();
  }, [fetchNow]);

  return { data, isLoading, error, refetch: fetchNow };
}
