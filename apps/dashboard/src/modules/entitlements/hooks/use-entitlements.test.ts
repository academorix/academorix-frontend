/**
 * @file use-entitlements.test.ts
 * @module modules/entitlements/hooks/use-entitlements.test
 *
 * @description
 * Unit tests for {@link useEntitlementsUsage}. Mocks `httpClient` at the
 * `@/lib/http` module boundary so the hook's fetch path is deterministic.
 *
 * Covers:
 *   1. Happy path — fetches `/entitlements/usage`, unwraps the envelope.
 *   2. Empty response — a freshly-provisioned tenant with no grants.
 *   3. Error path — a rejected fetch surfaces on `error`.
 *   4. Refetch — subsequent calls update the exposed data.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EntitlementUsage } from "@/types";

const httpGet = vi.fn();

vi.mock("@/lib/http", () => ({
  httpClient: {
    get: (path: string) => httpGet(path),
  },
  // Same passthrough as the billing hook tests — supports both envelope shapes.
  unwrapEnvelope: <T>(raw: unknown): T => {
    if (typeof raw === "object" && raw !== null && "data" in (raw as Record<string, unknown>)) {
      return (raw as { data: T }).data;
    }

    return raw as T;
  },
}));

// Import AFTER the mock so the hook picks up the stub.
import { useEntitlementsUsage } from "@/modules/entitlements/hooks/use-entitlements";

const MATRIX: EntitlementUsage[] = [
  {
    key: "athlete_slot",
    label: "Athletes",
    type: "slot",
    used: 47,
    limit: 100,
    is_unlimited: false,
  },
  {
    key: "team_slot",
    label: "Teams",
    type: "slot",
    used: 6,
    limit: 20,
    is_unlimited: false,
  },
  {
    key: "sso_feature",
    label: "SSO",
    type: "feature",
    used: 0,
    limit: null,
    is_unlimited: false,
  },
];

beforeEach(() => {
  httpGet.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useEntitlementsUsage", () => {
  it("fetches /entitlements/usage and returns the full matrix", async () => {
    httpGet.mockResolvedValueOnce({ data: MATRIX });

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(httpGet).toHaveBeenCalledWith("/entitlements/usage");
    expect(result.current.data).toEqual(MATRIX);
    expect(result.current.error).toBeNull();
  });

  it("accepts a bare payload without a data envelope", async () => {
    httpGet.mockResolvedValueOnce(MATRIX);

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(MATRIX);
  });

  it("returns an empty array for a freshly-provisioned tenant", async () => {
    httpGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("captures a rejected fetch on the error state", async () => {
    httpGet.mockRejectedValueOnce(new Error("entitlements service down"));

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("entitlements service down");
  });

  it("wraps a non-Error rejection value in an Error", async () => {
    httpGet.mockRejectedValueOnce("string rejection");

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("string rejection");
  });

  it("refetches on demand", async () => {
    httpGet.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useEntitlementsUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    httpGet.mockResolvedValueOnce({ data: MATRIX });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual(MATRIX);
    });

    expect(httpGet).toHaveBeenCalledTimes(2);
  });
});
