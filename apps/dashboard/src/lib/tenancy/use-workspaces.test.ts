/**
 * @file use-workspaces.test.ts
 * @module lib/tenancy/use-workspaces.test
 *
 * @description
 * Unit tests for the {@link useMyWorkspaces} hook.
 *
 * Since the mock data layer was removed the hook now goes straight through
 * the shared {@link httpClient} to `GET /v1/auth/workspaces`. The tests
 * stub the global `fetch` per case (which is what the client's `request()`
 * loop calls internally) and use `renderHook` + `waitFor` to observe the
 * async state transitions.
 *
 * The states we care about:
 *   1. Fetch resolves with a bare array — the hook exposes them as-is.
 *   2. Fetch resolves with a `{ data }` envelope — the hook unwraps it.
 *   3. Fetch resolves with `404` — the endpoint isn't deployed yet; the
 *      hook silently returns an empty list.
 *   4. Fetch rejects (transport failure) — the hook records the error on
 *      `result.error` so the picker can surface it.
 *   5. Never-resolving fetch — the hook starts in a loading state.
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
 * Build a real {@link Response} so the httpClient's `parseBody()` can read
 * `.status`, `.headers.get(...)`, and `.json()` the way it does in prod.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Stubs `fetch` with a factory that yields a Response. */
function stubFetch(factory: () => Promise<Response>): void {
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

    stubFetch(async () => jsonResponse(list));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(list);
    expect(result.current.error).toBeNull();
  });

  it("also accepts a { data } envelope from the backend", async () => {
    const list = [makeWorkspace({ id: "t-3", slug: "coastal", name: "Coastal Athletics" })];

    stubFetch(async () => jsonResponse({ data: list }));

    const { result } = renderHook(() => useMyWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(list);
  });

  it("returns an empty list and no error on a 404 (endpoint not yet deployed)", async () => {
    stubFetch(async () => jsonResponse({ message: "Not Found" }, 404));

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
