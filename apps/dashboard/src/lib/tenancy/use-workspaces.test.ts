/**
 * @file use-workspaces.test.ts
 * @module lib/tenancy/use-workspaces.test
 *
 * @description
 * Unit tests for the {@link useMyWorkspaces} hook. Because the test env has
 * `VITE_API_MOCK=true` (see `apps/web/environments/.env`), the hook goes
 * through the `fetch("/data/workspaces.json")` branch. The tests stub the
 * global `fetch` per case and use `renderHook` + `waitFor` to observe the
 * async state transitions.
 *
 * The three states we care about:
 *   1. Fetch resolves with the workspace list — the hook exposes them.
 *   2. Fetch resolves with `ok: false` — the hook silently returns an empty
 *      list (never surfaces the HTTP error to the picker UI).
 *   3. Fetch rejects — the hook records the error on `result.error`.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceListEntry } from "@/lib/tenancy";

import { useMyWorkspaces } from "@/lib/tenancy/use-workspaces";

/** Build one plausible workspace entry for tests. */
function makeWorkspace(overrides: Partial<WorkspaceListEntry> = {}): WorkspaceListEntry {
  return {
    id: "t-1",
    slug: "riverside",
    name: "Riverside Sports Academy",
    logo_url: null,
    role: "Owner",
    last_active_at: null,
    ...overrides,
  };
}

/**
 * Stubs `fetch` with a factory that returns a Response-shaped object. Only
 * the two fields the hook reads (`ok`, `json`) need to be present.
 */
function stubFetch(factory: () => Promise<{ ok: boolean; json: () => Promise<unknown> }>): void {
  vi.stubGlobal("fetch", vi.fn(factory));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useMyWorkspaces", () => {
  it("returns workspaces when the fetch resolves with the expected list", async () => {
    const list = [
      makeWorkspace({ id: "t-1", slug: "riverside", name: "Riverside Sports Academy" }),
      makeWorkspace({ id: "t-2", slug: "harbor", name: "Harbor Aquatics" }),
    ];

    stubFetch(async () => ({
      ok: true,
      json: async () => list,
    }));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(list);
    expect(result.current.error).toBeNull();
  });

  it("also accepts a { data } envelope from the mock fixture", async () => {
    const list = [makeWorkspace({ id: "t-3", slug: "coastal", name: "Coastal Athletics" })];

    stubFetch(async () => ({
      ok: true,
      json: async () => ({ data: list }),
    }));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(list);
  });

  it("returns an empty list and no error when the fetch responds not-ok", async () => {
    stubFetch(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("records the thrown error when fetch rejects", async () => {
    const boom = new Error("network down");

    // Reject the promise so the outer try/catch captures the error.
    stubFetch(() => Promise.reject(boom));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("network down");
  });

  it("starts in a loading state before the fetch settles", () => {
    // A never-resolving fetch keeps the hook in its initial loading state.
    stubFetch(() => new Promise(() => {}));

    const { result } = renderHook(() => useMyWorkspaces());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.workspaces).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
