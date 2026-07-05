/**
 * @file use-subscription.test.ts
 * @module lib/billing/use-subscription.test
 *
 * @description
 * Unit tests for the identity-derived accessor hooks. We stub Refine's
 * `useGetIdentity` at the module boundary so each case can inject a specific
 * `Identity` shape (no real auth provider needed).
 *
 * The three cases per hook cover:
 *   1. Identity populated → hook exposes the embedded value.
 *   2. Identity partially populated (missing subscription / quota_summary) →
 *      hook returns the documented fallback (`null` / `[]`).
 *   3. Identity still loading (`undefined`) → hook returns the fallback so
 *      the caller renders "nothing" instead of throwing.
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Identity, QuotaHeadline, SubscriptionSummary } from "@/types";

/**
 * `useGetIdentity` is stubbed at the `@refinedev/core` module boundary — the
 * hooks under test import it from there. Each test resets the mock in a
 * `beforeEach` so cases stay isolated.
 */
const useGetIdentityMock = vi.fn();

vi.mock("@refinedev/core", () => ({
  useGetIdentity: () => useGetIdentityMock(),
}));

// Import AFTER the mock so the hooks pick up the mocked module.
import { useQuotaFor, useQuotaSummary, useSubscription } from "@/lib/billing/use-subscription";
import { makeIdentity } from "@/test/fixtures";

/** Fixture subscription used in the populated cases. */
const SUBSCRIPTION: SubscriptionSummary = {
  id: 42,
  plan_key: "growth",
  plan_id: 3,
  plan_version: 1,
  status: "active",
  entitlements_active: true,
  billing_period: "monthly",
  currency: "USD",
  trial_ends_at: null,
  current_period_ends_at: "2026-08-02T00:00:00+00:00",
  grace_ends_at: null,
  canceled_at: null,
};

/** Fixture quotas used in the populated cases. */
const QUOTAS: QuotaHeadline[] = [
  { key: "athlete_slot", used: 47, limit: 100 },
  { key: "branch_slot", used: 2, limit: 5 },
  { key: "team_slot", used: 6, limit: 20 },
];

/**
 * Configures the mocked `useGetIdentity` to return the given identity as if
 * Refine had resolved it. `undefined` mimics the initial (still-loading)
 * state.
 */
function setIdentity(identity: Identity | undefined): void {
  useGetIdentityMock.mockReturnValue({ data: identity });
}

beforeEach(() => {
  useGetIdentityMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSubscription", () => {
  it("returns the embedded SubscriptionSummary", () => {
    setIdentity(makeIdentity({ subscription: SUBSCRIPTION }));

    const { result } = renderHook(() => useSubscription());

    expect(result.current).toEqual(SUBSCRIPTION);
  });

  it("returns null when the identity has no subscription (unsubscribed tenant)", () => {
    setIdentity(makeIdentity({ subscription: null }));

    const { result } = renderHook(() => useSubscription());

    expect(result.current).toBeNull();
  });

  it("returns null while the identity is loading", () => {
    setIdentity(undefined);

    const { result } = renderHook(() => useSubscription());

    expect(result.current).toBeNull();
  });
});

describe("useQuotaSummary", () => {
  it("returns the embedded quota headlines", () => {
    setIdentity(makeIdentity({ quota_summary: QUOTAS }));

    const { result } = renderHook(() => useQuotaSummary());

    expect(result.current).toEqual(QUOTAS);
  });

  it("returns an empty array when the identity has no quotas", () => {
    setIdentity(makeIdentity({ quota_summary: [] }));

    const { result } = renderHook(() => useQuotaSummary());

    expect(result.current).toEqual([]);
  });

  it("returns an empty array while the identity is loading", () => {
    setIdentity(undefined);

    const { result } = renderHook(() => useQuotaSummary());

    expect(result.current).toEqual([]);
  });
});

describe("useQuotaFor", () => {
  it("returns the matching quota by key", () => {
    setIdentity(makeIdentity({ quota_summary: QUOTAS }));

    const { result } = renderHook(() => useQuotaFor("branch_slot"));

    expect(result.current).toEqual({ key: "branch_slot", used: 2, limit: 5 });
  });

  it("returns undefined when the key is not in the summary (unlimited or n/a)", () => {
    setIdentity(makeIdentity({ quota_summary: QUOTAS }));

    const { result } = renderHook(() => useQuotaFor("nonexistent_slot"));

    expect(result.current).toBeUndefined();
  });

  it("returns undefined while the identity is loading", () => {
    setIdentity(undefined);

    const { result } = renderHook(() => useQuotaFor("athlete_slot"));

    expect(result.current).toBeUndefined();
  });
});
