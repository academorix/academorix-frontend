/**
 * @file use-subscription.ts
 * @module lib/billing/use-subscription
 *
 * @description
 * Two families of subscription hooks live here:
 *
 * 1. **Identity-derived accessors** — synchronous reads from the cached
 *    `Identity` (populated by the auth provider from `/api/auth/me`). No
 *    additional network calls happen when the banner or a quota meter
 *    renders. These are:
 *
 *    - {@link useSubscription} — the current `SubscriptionSummary` or `null`.
 *    - {@link useQuotaFor} — a single quota headline by key.
 *    - {@link useQuotaSummary} — the full headline list.
 *
 *    They are intentionally silent on unknown identity — they return
 *    `undefined` / `null` before `/me` resolves, and the consumer decides how
 *    to render the loading state (usually just nothing until the shell is
 *    ready).
 *
 * 2. **Live subscription hook** — {@link useLiveSubscription} fetches the
 *    canonical subscription for the active tenant against
 *    `GET /api/v1/subscriptions/current`. Where the identity-derived
 *    `useSubscription` gives you a synchronous read of what /auth/me
 *    embedded (used everywhere in the shell for zero-flicker banners), the
 *    live hook is what the billing settings page reaches for after a plan
 *    change so it can see the fresh state without waiting for the next /me
 *    round-trip. A 404 (no subscription yet) resolves to
 *    `{ subscription: null, isLoading: false }` rather than propagating an
 *    error — an unsubscribed tenant is a legitimate state.
 *
 *    `TODO(backend-endpoint): GET /api/v1/subscriptions/current` — until the
 *    backend billing module ships this endpoint, `useLiveSubscription` 404s
 *    and silently degrades to a `null` subscription. Remove this note when
 *    the endpoint is live in every environment.
 */

import { useGetIdentity } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";

import type { Identity, QuotaHeadline, SubscriptionSummary } from "@/types";

import { ApiError, httpClient, unwrapEnvelope } from "@/lib/http";

/**
 * Returns the current subscription snapshot, or `null` when the tenant has not
 * checked out yet (or when the identity is still loading).
 */
export function useSubscription(): SubscriptionSummary | null {
  const { data: identity } = useGetIdentity<Identity>();

  return identity?.subscription ?? null;
}

/** Returns every quota headline the backend embedded in `/me`. */
export function useQuotaSummary(): QuotaHeadline[] {
  const { data: identity } = useGetIdentity<Identity>();

  return identity?.quota_summary ?? [];
}

/**
 * Returns the quota headline for a given entitlement `key` (e.g.
 * `"athlete_slot"`), or `undefined` when the key isn't in the summary.
 * Unlimited grants are stripped by the backend, so an `undefined` result
 * means "no metered ceiling for this resource".
 */
export function useQuotaFor(key: string): QuotaHeadline | undefined {
  return useQuotaSummary().find((quota) => quota.key === key);
}

// ─────────────────────────────────────────────────────────────────────
// Live fetch — GET /api/v1/subscriptions/current
// ─────────────────────────────────────────────────────────────────────

/** State emitted by {@link useLiveSubscription}. */
export interface UseLiveSubscriptionResult {
  /**
   * The canonical subscription for the active tenant, or `null` when there
   * is no subscription (fresh tenant, canceled and post-period, or the
   * backend endpoint isn't wired yet and 404'd).
   */
  subscription: SubscriptionSummary | null;
  /** Whether the initial fetch is still in flight. */
  isLoading: boolean;
  /**
   * A non-null error surfaces genuine problems (5xx, transport). A 404 or
   * 501 is intentionally swallowed — an unsubscribed tenant is a
   * legitimate state, and a missing endpoint should degrade gracefully.
   */
  error: Error | null;
  /**
   * Force-refetch the current query. Consumers call this after a mutation
   * (plan change, cancel) so the settings page reflects the new state
   * without waiting for the next `/auth/me` cycle.
   */
  refetch: () => Promise<void>;
}

/**
 * Endpoint path (relative to the API base URL, which already carries the
 * `/api` prefix). Declared as a constant so the tests can pin the URL and
 * any accidental typo is a one-file fix.
 */
export const SUBSCRIPTION_CURRENT_PATH = "/v1/subscriptions/current";

/** HTTP status codes that resolve to `subscription: null` rather than an error. */
const NULL_SUBSCRIPTION_STATUSES: ReadonlySet<number> = new Set([404, 501]);

/**
 * Fetches the tenant's current subscription via
 * `GET /api/v1/subscriptions/current`. Distinct from the synchronous
 * {@link useSubscription} accessor above — this one triggers a real
 * network read so pages can see the latest state after a mutation.
 *
 * A 404 resolves to `{ subscription: null }` (unsubscribed tenant, or the
 * backend endpoint isn't deployed yet), so the settings page renders its
 * "Choose a plan" onboarding state rather than an error banner.
 *
 * `TODO(backend-endpoint): GET /api/v1/subscriptions/current` — remove this
 * marker when the backend billing module ships the endpoint.
 */
export function useLiveSubscription(): UseLiveSubscriptionResult {
  const query = useQuery<SubscriptionSummary | null, ApiError>({
    queryKey: ["billing", "subscriptions", "current"],
    queryFn: async () => {
      try {
        const raw = await httpClient.get<unknown>(SUBSCRIPTION_CURRENT_PATH);

        // Accept both the Foundation `{ data }` envelope and a bare
        // payload — `unwrapEnvelope` is safe on either shape.
        return unwrapEnvelope<SubscriptionSummary | null>(raw);
      } catch (caught) {
        if (caught instanceof ApiError && NULL_SUBSCRIPTION_STATUSES.has(caught.statusCode)) {
          return null;
        }

        throw caught;
      }
    },
    // Fail fast — retries on a persistent 5xx just churn.
    retry: false,
  });

  return {
    subscription: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
