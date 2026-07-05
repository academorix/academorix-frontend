/**
 * @file use-billing.test.ts
 * @module modules/billing/hooks/use-billing.test
 *
 * @description
 * Unit tests for the billing hooks: they wrap `httpClient` (POST/GET) around
 * every RPC endpoint the tenant's billing surface exposes. We stub the
 * client at the module boundary so each test observes exactly one call and
 * asserts on the path + payload.
 *
 * Read hooks (`useBillingStatus`, `useBillingInvoices`) follow a common shape
 * (`data`, `isLoading`, `error`, `refetch`) — we test the shape once per hook
 * plus the shared error + refetch paths.
 *
 * Mutation hooks (`usePauseSubscription`, `useResumeSubscription`,
 * `useCancelSubscription`, `useOpenBillingPortal`) follow
 * `{ isPending, error, mutate }` — we test the happy path (fetch → data) +
 * the error path (fetch rejects → error state).
 *
 * The public pricing catalog + first-time checkout used to live here as
 * `useBillingCatalog` + `useStartCheckout`; those moved to the marketing
 * app (apps/landing-page). This test file mirrors that trimmed surface.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SubscriptionSummary } from "@/types";

/**
 * The billing hooks import `httpClient` + `unwrapEnvelope` from `@/lib/http`.
 * We stub both at the module boundary so no real request is made and we can
 * inspect the calls.
 */
const httpGet = vi.fn();
const httpPost = vi.fn();

vi.mock("@/lib/http", () => ({
  httpClient: {
    get: (path: string) => httpGet(path),
    post: (path: string, body?: unknown) => httpPost(path, body),
  },
  // Passthrough — real unwrap logic doesn't need to be mocked; it handles both
  // Foundation `{data}` envelopes and bare payloads.
  unwrapEnvelope: <T>(raw: unknown): T => {
    if (typeof raw === "object" && raw !== null && "data" in (raw as Record<string, unknown>)) {
      return (raw as { data: T }).data;
    }

    return raw as T;
  },
}));

// Import AFTER the mock so the hooks pick up the stubbed httpClient.
import {
  useBillingInvoices,
  useBillingStatus,
  useCancelSubscription,
  useOpenBillingPortal,
  usePauseSubscription,
  useResumeSubscription,
} from "@/modules/billing/hooks/use-billing";

/** Convenience — an active subscription payload used in mutation results. */
const ACTIVE_SUBSCRIPTION: SubscriptionSummary = {
  id: 1,
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

beforeEach(() => {
  httpGet.mockReset();
  httpPost.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Read hooks
// ─────────────────────────────────────────────────────────────────────

describe("useBillingStatus", () => {
  it("fetches /billing/status and unwraps the envelope", async () => {
    httpGet.mockResolvedValueOnce({ data: ACTIVE_SUBSCRIPTION });

    const { result } = renderHook(() => useBillingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(httpGet).toHaveBeenCalledWith("/billing/status");
    expect(result.current.data).toEqual(ACTIVE_SUBSCRIPTION);
    expect(result.current.error).toBeNull();
  });

  it("captures a rejected fetch on error state", async () => {
    httpGet.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useBillingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("network down");
  });

  it("refetches on demand", async () => {
    httpGet.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useBillingStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    httpGet.mockResolvedValueOnce({ data: ACTIVE_SUBSCRIPTION });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual(ACTIVE_SUBSCRIPTION);
    });

    expect(httpGet).toHaveBeenCalledTimes(2);
  });
});

describe("useBillingInvoices", () => {
  it("fetches /billing/invoices and returns the list", async () => {
    const invoices = [
      {
        id: "in_1",
        number: "INV-001",
        issued_at: "2026-06-01T00:00:00Z",
        due_at: null,
        paid_at: "2026-06-01T00:00:00Z",
        status: "paid",
        total: "49.00",
        currency: "USD",
        pdf_url: null,
      },
    ];

    httpGet.mockResolvedValueOnce({ data: invoices });

    const { result } = renderHook(() => useBillingInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(httpGet).toHaveBeenCalledWith("/billing/invoices");
    expect(result.current.data).toEqual(invoices);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Mutation hooks
// ─────────────────────────────────────────────────────────────────────

describe("usePauseSubscription", () => {
  it("POSTs /billing/pause with no body", async () => {
    httpPost.mockResolvedValueOnce({ data: { ...ACTIVE_SUBSCRIPTION, status: "paused" } });

    const { result } = renderHook(() => usePauseSubscription());

    await result.current.mutate();

    expect(httpPost).toHaveBeenCalledWith("/billing/pause", undefined);
  });

  it("captures the thrown error on state", async () => {
    httpPost.mockRejectedValueOnce(new Error("cannot pause"));

    const { result } = renderHook(() => usePauseSubscription());

    await expect(result.current.mutate()).rejects.toThrow("cannot pause");

    await waitFor(() => {
      expect(result.current.error?.message).toBe("cannot pause");
    });
  });
});

describe("useResumeSubscription", () => {
  it("POSTs /billing/resume with no body", async () => {
    httpPost.mockResolvedValueOnce({ data: ACTIVE_SUBSCRIPTION });

    const { result } = renderHook(() => useResumeSubscription());

    await result.current.mutate();

    expect(httpPost).toHaveBeenCalledWith("/billing/resume", undefined);
  });
});

describe("useCancelSubscription", () => {
  it("POSTs /billing/cancel with no body", async () => {
    httpPost.mockResolvedValueOnce({ data: { ...ACTIVE_SUBSCRIPTION, status: "canceled" } });

    const { result } = renderHook(() => useCancelSubscription());

    await result.current.mutate();

    expect(httpPost).toHaveBeenCalledWith("/billing/cancel", undefined);
  });
});

describe("useOpenBillingPortal", () => {
  it("GETs /billing/portal and returns the redirect URL", async () => {
    httpGet.mockResolvedValueOnce({ data: { url: "https://portal.example/session/xyz" } });

    const { result } = renderHook(() => useOpenBillingPortal());

    const response = await result.current.mutate();

    expect(httpGet).toHaveBeenCalledWith("/billing/portal");
    expect(response).toEqual({ url: "https://portal.example/session/xyz" });
  });
});
