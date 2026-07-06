/**
 * @file use-billing.ts
 * @module modules/billing/hooks/use-billing
 *
 * @description
 * Small, imperative wrapper hooks around the backend's `/api/billing/*`
 * endpoints. These are **not** Refine CRUD resources — the billing surface is
 * a set of purpose-built RPC endpoints (`pause`, `resume`, `cancel`, `portal`)
 * plus two read endpoints (`status`, `invoices`). We call them via
 * {@link httpClient} directly and expose small hooks with
 * `{ data, isLoading, error, refetch }` state so pages can render without
 * pulling in a full data-provider round-trip.
 *
 * The identity's `SubscriptionSummary` (from `/me`) is the primary read source
 * for the shell (banner + quota meters); `/billing/status` here re-fetches
 * that same shape on demand so the settings screen sees fresh state after a
 * mutation without waiting for the next `/me` cycle.
 *
 * See BACKEND_HANDOFF.md §5.3-§5.5 for the endpoint contracts.
 *
 * ## Removed hooks (moved to the marketing app)
 * The public pricing catalog + checkout kick-off used to live here as
 * `useBillingCatalog` + `useStartCheckout`. Both were exercised by the
 * former public `/pricing` route; that surface now lives in
 * `apps/landing-page`, so the SPA no longer ships those hooks. Anonymous
 * plan discovery + first-time checkout is a marketing concern; the SPA
 * only handles authenticated tenant billing (pause / resume / cancel /
 * provider portal).
 */

import { useCallback, useEffect, useState } from "react";

import type { BillingInvoice, SubscriptionSummary } from "@/types";

import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http";

// ─────────────────────────────────────────────────────────────────────
// Shared state shape
// ─────────────────────────────────────────────────────────────────────

/** Standard three-state shape emitted by the read hooks. */
export interface BillingResource<T> {
  /** The loaded payload, or `null` while loading / on error. */
  data: T | null;
  /** True while the initial (or refetch) request is in flight. */
  isLoading: boolean;
  /** Any error thrown by the underlying fetch. */
  error: Error | null;
  /** Force-refetch the current query. */
  refetch: () => Promise<void>;
}

/** Standard shape emitted by the mutation helpers. */
export interface BillingMutation<Args, Result> {
  /** True while the mutation is in flight. */
  isPending: boolean;
  /** Any error thrown by the last mutation attempt. */
  error: Error | null;
  /** Perform the mutation. Resolves with the response payload on success. */
  mutate: (args: Args) => Promise<Result>;
}

/**
 * Generic "fetch-on-mount" helper used by the read hooks. Kept private so the
 * exported hooks are self-descriptive at the callsite.
 */
function useApiResource<T>(
  path: string,
  { enabled = true }: { enabled?: boolean } = {},
): BillingResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchNow = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await httpClient.get<unknown>(path);

      setData(unwrapEnvelope<T>(raw));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchNow();
  }, [enabled, fetchNow]);

  return { data, isLoading, error, refetch: fetchNow };
}

// ─────────────────────────────────────────────────────────────────────
// Read hooks
// ─────────────────────────────────────────────────────────────────────

/**
 * Fetches `GET /api/billing/status`. Same shape as the `/me.subscription`
 * embed, useful when the settings page needs a fresh read after a mutation.
 */
export function useBillingStatus(): BillingResource<SubscriptionSummary | null> {
  return useApiResource<SubscriptionSummary | null>("/billing/status");
}

/**
 * Fetches the tenant's paid invoices via `GET /api/billing/invoices`.
 */
export function useBillingInvoices(): BillingResource<BillingInvoice[]> {
  return useApiResource<BillingInvoice[]>("/billing/invoices");
}

// ─────────────────────────────────────────────────────────────────────
// Mutation hooks
// ─────────────────────────────────────────────────────────────────────

/** Response for portal calls that return a URL to redirect to. */
export interface BillingRedirectResponse {
  /** URL the SPA should navigate to (usually the provider portal). */
  url: string;
}

/**
 * Generic mutation helper. Kept small so the exported wrappers stay one-liners.
 */
function useBillingMutation<Args, Result>(
  fn: (args: Args) => Promise<Result>,
): BillingMutation<Args, Result> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (args: Args): Promise<Result> => {
      setIsPending(true);
      setError(null);
      try {
        return await fn(args);
      } catch (caught) {
        const err = caught instanceof Error ? caught : new Error(String(caught));

        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [fn],
  );

  return { isPending, error, mutate };
}

/**
 * Pauses the active subscription via `POST /api/billing/pause`. Returns the
 * updated `SubscriptionSummary` on success.
 */
export function usePauseSubscription(): BillingMutation<void, SubscriptionSummary> {
  return useBillingMutation(async () => {
    const raw = await httpClient.post<unknown>("/billing/pause");

    return unwrapEnvelope<SubscriptionSummary>(raw);
  });
}

/** Resumes a paused subscription via `POST /api/billing/resume`. */
export function useResumeSubscription(): BillingMutation<void, SubscriptionSummary> {
  return useBillingMutation(async () => {
    const raw = await httpClient.post<unknown>("/billing/resume");

    return unwrapEnvelope<SubscriptionSummary>(raw);
  });
}

/** Cancels the subscription via `POST /api/billing/cancel`. */
export function useCancelSubscription(): BillingMutation<void, SubscriptionSummary> {
  return useBillingMutation(async () => {
    const raw = await httpClient.post<unknown>("/billing/cancel");

    return unwrapEnvelope<SubscriptionSummary>(raw);
  });
}

/**
 * Fetches the provider portal URL via `GET /api/billing/portal`. Called
 * on-demand (button click) rather than eagerly on mount — provider portals
 * often issue short-lived signed URLs so we don't want to burn one on render.
 */
export function useOpenBillingPortal(): BillingMutation<void, BillingRedirectResponse> {
  return useBillingMutation(async () => {
    const raw = await httpClient.get<unknown>("/billing/portal");

    return unwrapEnvelope<BillingRedirectResponse>(raw);
  });
}
