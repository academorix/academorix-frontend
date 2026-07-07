/**
 * @file use-people-search.test.ts
 * @module modules/people/__tests__/use-people-search.test
 *
 * @description
 * Unit tests for {@link usePeopleSearch}. We mock the `@refinedev/core` seam
 * so we can:
 *
 *   1. Assert the hook waits for the debounce window before firing.
 *   2. Assert the filters shape the hook passes to `useList` (a single `q`
 *      filter with the trimmed, debounced value).
 *   3. Assert queries below the minimum length are disabled.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook depends on `useList` from `@refinedev/core`. We mock it so each
// test sees the exact arguments the hook forwards. `vi.hoisted` ensures the
// mock spy is available at module-init time (before the import below).
const useListMock = vi.hoisted(() => vi.fn());

vi.mock("@refinedev/core", () => ({
  useList: (args: unknown) => {
    useListMock(args);

    return {
      result: { data: [], total: 0 },
      query: { isLoading: false, error: undefined },
    };
  },
}));

import { DEFAULT_MIN_QUERY_LENGTH, usePeopleSearch } from "@/modules/people/use-people-search";

beforeEach(() => {
  vi.useFakeTimers();
  useListMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePeopleSearch", () => {
  it("is disabled while the debounced query is shorter than the min length", () => {
    renderHook(() => usePeopleSearch({ query: "j" }));

    // First call fires immediately on mount with the initial (empty)
    // debounced value.
    expect(useListMock).toHaveBeenCalled();

    const firstCall = useListMock.mock.calls[0]![0] as {
      queryOptions?: { enabled: boolean };
    };

    expect(firstCall.queryOptions?.enabled).toBe(false);
  });

  it("stays disabled and returns empty data below the minimum length", () => {
    const { result } = renderHook(() => usePeopleSearch({ query: "j" }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isBelowMinLength).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it("waits for the debounce window before firing the query", () => {
    const { rerender } = renderHook(({ query }) => usePeopleSearch({ query, delayMs: 300 }), {
      initialProps: { query: "" },
    });

    // Kick the input high enough to clear the min-length gate.
    rerender({ query: "jordan" });
    useListMock.mockClear();

    // Not yet — the debounce timer has not elapsed.
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // The hook re-renders on every input change and always calls `useList`
    // (Refine's own semantics). The interesting assertion is that the
    // `filters` argument still reflects the *stale* (empty) debounced value.
    for (const call of useListMock.mock.calls) {
      const args = call[0] as { filters?: unknown[]; queryOptions?: { enabled: boolean } };

      // Any call fired before the debounce elapsed must still be disabled
      // because the debounced value is shorter than the min-length.
      expect(args.queryOptions?.enabled).toBe(false);
    }

    // Now push through the debounce window.
    useListMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    // After the debounce, at least one call must fire with the enabled flag
    // and a `q` filter carrying the query.
    const enabledCall = useListMock.mock.calls.find((call) => {
      const args = call[0] as { queryOptions?: { enabled: boolean } };

      return args.queryOptions?.enabled === true;
    });

    expect(enabledCall).toBeDefined();

    const enabledArgs = enabledCall![0] as {
      filters?: Array<{ field: string; operator: string; value: string }>;
    };

    expect(enabledArgs.filters).toEqual([{ field: "q", operator: "contains", value: "jordan" }]);
  });

  it("trims whitespace off the debounced query before firing", () => {
    const { rerender } = renderHook(({ query }) => usePeopleSearch({ query, delayMs: 300 }), {
      initialProps: { query: "" },
    });

    rerender({ query: "   ada   " });
    useListMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const trimmed = useListMock.mock.calls
      .map((call) => call[0] as { filters?: Array<{ value: string }> })
      .find((args) => (args.filters?.[0]?.value ?? "").length > 0);

    expect(trimmed?.filters?.[0]?.value).toBe("ada");
  });

  it("respects a custom minLength", () => {
    const { rerender } = renderHook(
      ({ query }) => usePeopleSearch({ query, minLength: 4 }),
      { initialProps: { query: "ada" } },
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 3 chars, min is 4 → should stay disabled.
    const lastCall = useListMock.mock.calls.at(-1)?.[0] as {
      queryOptions?: { enabled: boolean };
    };

    expect(lastCall?.queryOptions?.enabled).toBe(false);

    rerender({ query: "jane" });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 4 chars, min is 4 → should now be enabled.
    const enabledCall = useListMock.mock.calls.find((call) => {
      const args = call[0] as { queryOptions?: { enabled: boolean } };

      return args.queryOptions?.enabled === true;
    });

    expect(enabledCall).toBeDefined();
  });

  it("exposes the default minimum length constant", () => {
    expect(DEFAULT_MIN_QUERY_LENGTH).toBeGreaterThan(0);
  });
});
