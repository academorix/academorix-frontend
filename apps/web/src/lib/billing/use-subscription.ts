/**
 * @file use-subscription.ts
 * @module lib/billing/use-subscription
 *
 * @description
 * Small identity-derived accessor hooks for the shell's subscription + quota
 * chrome. Everything is a synchronous read from the cached `Identity` (populated
 * by the auth provider from `/api/auth/me`), so no additional network calls
 * happen when the banner or a quota meter renders.
 *
 * - {@link useSubscription} — the current `SubscriptionSummary` or `null`.
 * - {@link useQuotaFor} — a single quota headline by key.
 * - {@link useQuotaSummary} — the full headline list.
 *
 * These hooks are intentionally silent on unknown identity — they return
 * `undefined` / `null` before `/me` resolves, and the consumer decides how to
 * render the loading state (usually just nothing until the shell is ready).
 */

import { useGetIdentity } from "@refinedev/core";

import type { Identity, QuotaHeadline, SubscriptionSummary } from "@/types";

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
