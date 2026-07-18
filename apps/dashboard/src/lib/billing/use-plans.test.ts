/**
 * @file use-plans.test.ts
 * @module lib/billing/use-plans.test
 *
 * @description
 * Unit tests for {@link usePlans}. The hook has two data paths — Refine's
 * `useList<Plan>` (primary) and a static `fetch("/data/plans.json")`
 * fallback — so we mock `@refinedev/core` at the module boundary for the
 * primary path and stub the global `fetch` for the fallback path. Feature
 * flag branches are tested by stubbing the config module too.
 *
 * The state matrix under test:
 *
 *   1. Flag ON, live succeeds → hook exposes the live plans.
 *   2. Flag ON, live 404s → hook silently falls back to static plans.
 *   3. Flag ON, live 501s → hook silently falls back to static plans.
 *   4. Flag ON, live 500s (real error) → hook surfaces the error.
 *   5. Flag OFF → hook fetches static plans, live path stays disabled.
 *   6. Flag OFF, static fetch fails → hook resolves to an empty catalog.
 *   7. Flag OFF → hook exposes `defaultPlanId` from static `meta`.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Plan, PlansResponse } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks — Refine's useList + the features registry
// ─────────────────────────────────────────────────────────────────────

/**
 * Handle we drive per-test to control what Refine's `useList` returns.
 * Using `vi.hoisted` because the mock body below is evaluated before the
 * `usePlans` import resolves the mocked module.
 */
const useListMock = vi.hoisted(() =>
  vi.fn<
    (args: unknown) => {
      result: { data: Plan[] } | undefined;
      query: { isLoading: boolean; error: unknown };
    }
  >(),
);

vi.mock("@refinedev/core", () => ({
  useList: (args: unknown) => useListMock(args),
}));

/**
 * Feature-flag registry — stubbed here so each test can flip
 * `billingLivePlans` on/off. Every other flag in the real registry has a
 * documented default; we don't touch those. Wrapped in `vi.hoisted` so the
 * object identity survives Vitest's `vi.mock` hoisting.
 */
const featuresMock = vi.hoisted(() => ({ billingLivePlans: false }));

vi.mock("@/config/features.config", () => ({
  features: featuresMock,
}));

// Import AFTER the mocks so the module picks them up.
import { usePlans } from "@/lib/billing/use-plans";
import { ApiError } from "@/lib/http";

// ─────────────────────────────────────────────────────────────────────
// Fixtures + helpers
// ─────────────────────────────────────────────────────────────────────

/** A pair of plans we can hand back from `useList` in the live path. */
const LIVE_PLANS: Plan[] = [
  {
    id: "plan_growth_monthly",
    name: "Growth",
    tier: "growth",
    cadence: "monthly",
    price: "99.00",
    currency: "USD",
    features: ["scheduling", "attendance"],
    quotas: { athlete_slot: 500 },
  },
  {
    id: "plan_pro_monthly",
    name: "Pro",
    tier: "pro",
    cadence: "monthly",
    price: "249.00",
    currency: "USD",
    features: ["scheduling", "sso"],
    quotas: { athlete_slot: 2000 },
  },
];

/** A pair of plans we serve from the static fixture path. */
const STATIC_RESPONSE: PlansResponse = {
  data: [
    {
      id: "plan_starter_monthly",
      name: "Starter",
      tier: "starter",
      cadence: "monthly",
      price: "0.00",
      currency: "USD",
      features: ["single_branch"],
      quotas: { athlete_slot: 100 },
    },
  ],
  meta: {
    default_plan_id: "plan_starter_monthly",
    currency: "USD",
  },
};

/**
 * Wraps a `renderHook` call in a fresh TanStack QueryClient so each test
 * starts with an empty cache (no cross-test bleed between the "static"
 * query key).
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

/**
 * Builds a real `Response` so the hook's `fetch(...).json()` path resolves
 * with the same shape production would see.
 */
function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** Stubs the global `fetch` for the static fallback path. */
function stubStaticFetch(factory: () => Promise<Response>): void {
  vi.stubGlobal("fetch", vi.fn(factory));
}

/** Default useList shape: idle + empty (the live path is disabled). */
function idleUseList(): {
  result: { data: Plan[] } | undefined;
  query: { isLoading: boolean; error: unknown };
} {
  return { result: { data: [] }, query: { isLoading: false, error: null } };
}

beforeEach(() => {
  featuresMock.billingLivePlans = false;
  useListMock.mockReset();
  useListMock.mockReturnValue(idleUseList());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("usePlans (flag on)", () => {
  beforeEach(() => {
    featuresMock.billingLivePlans = true;
  });

  it("returns the live plans when the useList call resolves", async () => {
    useListMock.mockReturnValue({
      result: { data: LIVE_PLANS },
      query: { isLoading: false, error: null },
    });

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual(LIVE_PLANS);
    expect(result.current.error).toBeNull();
    // Live path can't surface defaultPlanId — Refine's useList strips meta.
    expect(result.current.defaultPlanId).toBeNull();
  });

  it("falls back to the static catalog when the live endpoint 404s", async () => {
    useListMock.mockReturnValue({
      result: undefined,
      query: { isLoading: false, error: new ApiError("Not Found", 404) },
    });
    stubStaticFetch(async () => jsonResponse(STATIC_RESPONSE));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.plans.length).toBeGreaterThan(0);
    });

    expect(result.current.plans).toEqual(STATIC_RESPONSE.data);
    expect(result.current.error).toBeNull();
    expect(result.current.defaultPlanId).toBe(STATIC_RESPONSE.meta.default_plan_id);
  });

  it("falls back on 501 as well as 404", async () => {
    useListMock.mockReturnValue({
      result: undefined,
      query: { isLoading: false, error: new ApiError("Not Implemented", 501) },
    });
    stubStaticFetch(async () => jsonResponse(STATIC_RESPONSE));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.plans.length).toBeGreaterThan(0);
    });

    expect(result.current.plans).toEqual(STATIC_RESPONSE.data);
    expect(result.current.error).toBeNull();
  });

  it("surfaces genuine 5xx errors from the live endpoint (no fallback)", async () => {
    useListMock.mockReturnValue({
      result: undefined,
      query: { isLoading: false, error: new ApiError("Server Error", 500) },
    });
    stubStaticFetch(async () => jsonResponse(STATIC_RESPONSE));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe("Server Error");
  });
});

describe("usePlans (flag off)", () => {
  it("skips the live path entirely and fetches static plans", async () => {
    // Flag stays false via the outer `beforeEach`.
    stubStaticFetch(async () => jsonResponse(STATIC_RESPONSE));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.plans.length).toBeGreaterThan(0);
    });

    expect(result.current.plans).toEqual(STATIC_RESPONSE.data);
    expect(result.current.defaultPlanId).toBe(STATIC_RESPONSE.meta.default_plan_id);
    expect(result.current.error).toBeNull();

    // Live path was disabled — useList's `enabled` argument should be false.
    const args = useListMock.mock.calls[0]?.[0] as
      { queryOptions?: { enabled?: boolean } } | undefined;

    expect(args?.queryOptions?.enabled).toBe(false);
  });

  it("resolves to an empty catalog when the static fetch fails", async () => {
    stubStaticFetch(async () => jsonResponse({}, { status: 500 }));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBeNull();
    // Empty meta.default_plan_id is normalised to null.
    expect(result.current.defaultPlanId).toBeNull();
  });

  it("resolves to an empty catalog when the fetch rejects", async () => {
    stubStaticFetch(() => Promise.reject(new Error("offline")));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("resolves to an empty catalog when the JSON is malformed", async () => {
    stubStaticFetch(async () => jsonResponse({ not_a_data_array: true }));

    const { result } = renderHook(() => usePlans(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plans).toEqual([]);
  });
});
