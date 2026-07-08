/**
 * @file use-subscription.test.ts
 * @module lib/billing/use-subscription.test
 *
 * @description
 * Unit tests for the identity-derived accessor hooks and the live
 * subscription fetch hook. The identity accessors stub Refine's
 * `useGetIdentity` at the module boundary so each case can inject a specific
 * `Identity` shape (no real auth provider needed). The live hook stubs the
 * global `fetch` so we can drive the underlying `httpClient` deterministically.
 *
 * Coverage:
 *
 *   Identity accessors (`useSubscription`, `useQuotaSummary`, `useQuotaFor`):
 *   1. Identity populated → hook exposes the embedded value.
 *   2. Identity partially populated (missing subscription / quota_summary) →
 *      hook returns the documented fallback (`null` / `[]`).
 *   3. Identity still loading (`undefined`) → hook returns the fallback so
 *      the caller renders "nothing" instead of throwing.
 *
 *   Live subscription (`useLiveSubscription`):
 *   4. Live endpoint responds with an unwrapped payload → hook returns it.
 *   5. Live endpoint responds with a `{ data }` envelope → hook unwraps it.
 *   6. Live endpoint 404s → hook resolves to `subscription: null`, no error.
 *   7. Live endpoint 501s → same graceful degradation as 404.
 *   8. Live endpoint 500s → hook surfaces the error.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Identity, QuotaHeadline, SubscriptionSummary } from "@/types";
import type { ReactNode } from "react";

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
import {
  SUBSCRIPTION_CURRENT_PATH,
  useLiveSubscription,
  useQuotaFor,
  useQuotaSummary,
  useSubscription,
} from "@/lib/billing/use-subscription";
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

/**
 * Builds a real `Response` so the httpClient's `parseBody()` reads
 * `.status`, `.headers.get(...)`, and `.json()` the way production does.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Stubs the global `fetch` with a factory returning a Response. */
function stubFetch(factory: () => Promise<Response>): void {
  vi.stubGlobal("fetch", vi.fn(factory));
}

/**
 * Wraps a `renderHook` call in a fresh TanStack QueryClient so each test
 * starts with an empty cache (no cross-test bleed between the shared
 * `billing.subscriptions.current` query key).
 */
function makeWrapper(): (options: { children: ReactNode }) => ReactNode {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });

  // Named function so the `react/display-name` lint rule is happy on the
  // wrapper — the plain arrow-form triggers a false positive because
  // renderHook accepts a component.
  function QueryClientWrapper({ children }: { children: ReactNode }): ReactNode {
    return createElement(QueryClientProvider, { client }, children);
  }

  return QueryClientWrapper;
}

beforeEach(() => {
  useGetIdentityMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
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

describe("useLiveSubscription", () => {
  it("declares the canonical endpoint path so consumers can pin it in tests", () => {
    expect(SUBSCRIPTION_CURRENT_PATH).toBe("/v1/subscriptions/current");
  });

  it("returns the subscription when the endpoint responds with an unwrapped payload", async () => {
    stubFetch(async () => jsonResponse(SUBSCRIPTION));

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(SUBSCRIPTION);
    expect(result.current.error).toBeNull();
  });

  it("unwraps the Foundation `{ data }` envelope shape", async () => {
    stubFetch(async () => jsonResponse({ data: SUBSCRIPTION }));

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(SUBSCRIPTION);
  });

  it("resolves to `subscription: null` when the endpoint returns 404 (no subscription yet)", async () => {
    stubFetch(async () => jsonResponse({ message: "Not Found" }, 404));

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("degrades on 501 (backend endpoint not deployed yet) without surfacing the error", async () => {
    stubFetch(async () => jsonResponse({ message: "Not Implemented" }, 501));

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("surfaces non-404/501 errors on the returned error field", async () => {
    stubFetch(async () => jsonResponse({ message: "Server error" }, 500));

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("exposes a refetch that fires the endpoint again", async () => {
    const fetchStub = vi.fn(async () => jsonResponse({ data: SUBSCRIPTION }));

    vi.stubGlobal("fetch", fetchStub);

    const { result } = renderHook(() => useLiveSubscription(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCalls = fetchStub.mock.calls.length;

    await result.current.refetch();

    await waitFor(() => {
      expect(fetchStub.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
