/**
 * @file define-resource.test.tsx
 * @module @academorix/query/resource/__tests__/define-resource.test
 *
 * @description
 * React Testing Library tests for {@link defineResource}. Each hook
 * runs inside a fresh `QueryClientProvider` (retries disabled) so
 * tests exercise the real `@tanstack/react-query` runtime.
 *
 * The `HttpClient` is stubbed with `vi.fn()`s. Tests then:
 *
 *  1. Assert the exact requests each hook emits.
 *  2. Return canned bodies (envelopes, bare arrays, undefined) to
 *     prove the unwrap logic works.
 *  3. Reject to prove `HttpError` propagates on the query result.
 *
 * Covered:
 *
 *  - `useList` — returns `{ data, total }` from a Foundation envelope.
 *  - `useOne` — unwraps a `{ data }` envelope.
 *  - `useCreate` — POSTs + invalidates the list cache.
 *  - `useUpdate` — PATCHes + invalidates both one + list caches.
 *  - `useDelete` — DELETEs + invalidates both caches.
 *  - HTTP client throws → `HttpError` propagates on the query result.
 */

import { HttpError } from "@academorix/core/errors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { listKey, oneKey } from "../../query-keys/build-query-key.util";
import { defineResource } from "../define-resource";

import type { HttpClient } from "@academorix/http/client";
import type { ReactNode } from "react";
import type { Mock } from "vitest";

/** Minimal shape of the stubbed HTTP client — only the methods we call. */
interface StubHttpClient {
  get: Mock;
  post: Mock;
  patch: Mock;
  delete: Mock;
}

/**
 * Returns a fresh stub client. Individual tests override the method
 * they care about via `.mockResolvedValueOnce` / `.mockRejectedValueOnce`.
 */
function makeStubClient(): StubHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Casts the stub into the shape `defineResource` expects. The cast is
 * safe because the factory only calls the subset of `HttpClient`
 * mirrored in {@link StubHttpClient}.
 */
function asClient(stub: StubHttpClient): HttpClient {
  return stub as unknown as HttpClient;
}

/**
 * Returns a per-test `QueryClient` with retries disabled so a
 * rejected mock throws immediately (no waiting on the default backoff
 * schedule).
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Wraps `renderHook`'s child tree in a `QueryClientProvider` bound to
 * a per-test `QueryClient`. Returns both the wrapper factory and the
 * underlying client (tests inspect the cache directly for
 * invalidation assertions).
 */
function makeWrapper(): {
  wrapper: ({ children }: { children: ReactNode }) => ReactNode;
  queryClient: QueryClient;
} {
  const queryClient = makeQueryClient();

  function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { wrapper: Wrapper, queryClient };
}

/** Sample record type — matches how apps typically model a domain entity. */
interface Student {
  id: string;
  name: string;
}

describe("defineResource", () => {
  let stub: StubHttpClient;

  beforeEach(() => {
    stub = makeStubClient();
  });

  describe("useList", () => {
    it("returns { data, total } from a Foundation envelope", async () => {
      stub.get.mockResolvedValueOnce({
        data: [{ id: "1", name: "Ada" }],
        meta: { total: 12 },
      });

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useList({ page: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [{ id: "1", name: "Ada" }],
        total: 12,
      });
      expect(stub.get).toHaveBeenCalledWith(
        "students",
        expect.objectContaining({ searchParams: expect.any(URLSearchParams) }),
      );
    });

    it("returns bare arrays with total: undefined", async () => {
      stub.get.mockResolvedValueOnce([{ id: "1", name: "Ada" }]);

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [{ id: "1", name: "Ada" }],
        total: undefined,
      });
    });

    it("propagates HttpError on the query result when the client throws", async () => {
      const err = new HttpError("Not found", 404);

      stub.get.mockRejectedValueOnce(err);

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(err);
    });
  });

  describe("useOne", () => {
    it("unwraps a { data } envelope for a single record", async () => {
      stub.get.mockResolvedValueOnce({ data: { id: "1", name: "Ada" } });

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useOne("1"), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: "1", name: "Ada" });
      expect(stub.get).toHaveBeenCalledWith("students/1");
    });

    it("returns a bare object unchanged", async () => {
      stub.get.mockResolvedValueOnce({ id: "1", name: "Ada" });

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useOne("1"), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: "1", name: "Ada" });
    });
  });

  describe("useCreate", () => {
    it("POSTs the variables and invalidates the list cache on success", async () => {
      stub.post.mockResolvedValueOnce({ data: { id: "1", name: "Ada" } });

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => resource.useCreate(), { wrapper });

      let mutationResult: Student | undefined;

      await act(async () => {
        mutationResult = await result.current.mutateAsync({ name: "Ada" });
      });

      expect(stub.post).toHaveBeenCalledWith("students", { name: "Ada" });
      expect(mutationResult).toEqual({ id: "1", name: "Ada" });

      // The list cache is invalidated so any mounted `useList` re-fetches.
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...listKey("@academorix", "students")],
      });
    });
  });

  describe("useUpdate", () => {
    it("PATCHes and invalidates both the one + list caches", async () => {
      stub.patch.mockResolvedValueOnce({ data: { id: "1", name: "Ada Lovelace" } });

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => resource.useUpdate(), { wrapper });

      let mutationResult: Student | undefined;

      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          id: "1",
          changes: { name: "Ada Lovelace" },
        });
      });

      expect(stub.patch).toHaveBeenCalledWith("students/1", { name: "Ada Lovelace" });
      expect(mutationResult).toEqual({ id: "1", name: "Ada Lovelace" });

      // Both the single-record cache and the list cache are invalidated so
      // any mounted consumer refetches after the update completes.
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...oneKey("@academorix", "students", "1")],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...listKey("@academorix", "students")],
      });
    });
  });

  describe("useDelete", () => {
    it("DELETEs and invalidates both the one + list caches", async () => {
      stub.delete.mockResolvedValueOnce(undefined);

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper, queryClient } = makeWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => resource.useDelete(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("1");
      });

      expect(stub.delete).toHaveBeenCalledWith("students/1");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...oneKey("@academorix", "students", "1")],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [...listKey("@academorix", "students")],
      });
    });
  });

  describe("error propagation", () => {
    it("normalises a plain Error into an HttpError with statusCode undefined", async () => {
      stub.get.mockRejectedValueOnce(new Error("network down"));

      const resource = defineResource<Student>({ path: "students" }, { client: asClient(stub) });
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => resource.useOne("1"), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(HttpError);
      expect(result.current.error?.statusCode).toBeUndefined();
      expect(result.current.error?.message).toBe("network down");
    });
  });
});
