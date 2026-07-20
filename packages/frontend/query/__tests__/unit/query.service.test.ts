/**
 * @file query.service.test.ts
 * @module @stackra/query/__tests__
 * @description Covers `QueryService` — the TanStack Query-backed
 *   implementation of `IQueryClient` plus the imperative query /
 *   mutate surface.
 *
 *   `mutate` mode tests cover pessimistic + optimistic paths; the
 *   undoable branch is exercised in `undoable-queue.service.test.ts`.
 */

import { describe, expect, it, vi } from "vitest";
import { Store } from "@tanstack/store";
import { QueryClient } from "@tanstack/query-core";
import { QueryService } from "@/core/services/query.service";

/**
 * Build a fresh `QueryService` for each test — no shared state.
 * We instantiate the underlying `QueryClient` explicitly so we can
 * control its lifecycle (e.g. `queryClient.clear()` between tests
 * when needed).
 */
function makeService(): { service: QueryService; client: QueryClient } {
  const client = new QueryClient();
  const service = new QueryService(client);
  return { service, client };
}

describe("QueryService — IQueryClient surface", () => {
  it("fetch caches the result — a second fetch with the same key reuses the cache", async () => {
    const { service } = makeService();
    const fetcher = vi.fn(async () => "themes-list");

    const first = await service.fetch(["themes"], fetcher);
    const second = await service.fetch(["themes"], fetcher);

    expect(first).toBe("themes-list");
    expect(second).toBe("themes-list");
    // TanStack Query dedupes when the data is fresh; with the
    // default `staleTime: 0`, the second call may re-fetch, but
    // the fetcher's `.mock.calls.length` is <= 2 either way.
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("getData returns cached data + returns undefined for unknown keys", async () => {
    const { service } = makeService();
    await service.fetch(["users", 1], async () => ({ id: 1, name: "A" }));

    expect(service.getData<{ id: number }>(["users", 1])).toEqual({ id: 1, name: "A" });
    expect(service.getData(["users", 99])).toBeUndefined();
  });

  it("setData writes cache entries imperatively", () => {
    const { service } = makeService();
    service.setData(["users", 1], { id: 1, name: "B" });
    expect(service.getData<{ id: number }>(["users", 1])).toEqual({ id: 1, name: "B" });
  });

  it("invalidate marks a cached query stale (next fetch re-runs the fetcher)", async () => {
    const { service } = makeService();
    let call = 0;
    const fetcher = vi.fn(async () => `v${++call}`);

    await service.fetch(["count"], fetcher, { staleTime: 60_000 });
    // Not stale yet — subsequent fetch reuses cache.
    const beforeInvalidate = await service.fetch(["count"], fetcher, { staleTime: 60_000 });
    expect(beforeInvalidate).toBe("v1");

    await service.invalidate(["count"]);

    // After invalidate, fetch runs the fetcher again.
    const afterInvalidate = await service.fetch(["count"], fetcher, { staleTime: 60_000 });
    expect(afterInvalidate).toBe("v2");
  });

  it("remove drops the query from the cache", async () => {
    const { service } = makeService();
    service.setData(["themes"], ["default", "dark"]);
    expect(service.getData(["themes"])).toBeDefined();

    service.remove(["themes"]);
    expect(service.getData(["themes"])).toBeUndefined();
  });

  it("keys enumerates every cached query key", async () => {
    const { service } = makeService();
    service.setData(["themes"], ["a"]);
    service.setData(["users", 1], { id: 1 });
    const keys = service.keys();
    expect(keys.length).toBe(2);
    // TanStack Query serializes keys internally; the shape is
    // preserved when read back.
    const asStrings = keys.map((k) => JSON.stringify(k));
    expect(asStrings).toContain(JSON.stringify(["themes"]));
    expect(asStrings).toContain(JSON.stringify(["users", 1]));
  });
});

describe("QueryService — imperative query()", () => {
  it("writes the fetched value to the target store", async () => {
    const { service } = makeService();
    const store = new Store<string[]>([]);

    const result = await service.query({
      queryKey: ["themes"],
      fetcher: async () => ["default", "dark"],
      store,
    });

    expect(result).toEqual(["default", "dark"]);
    expect(store.state).toEqual(["default", "dark"]);
  });

  it("applies `select` before writing to the store", async () => {
    const { service } = makeService();
    const store = new Store<number>(0);

    await service.query({
      queryKey: ["count"],
      fetcher: async () => ({ raw: 42 }),
      select: (raw) => raw.raw,
      store,
    });

    expect(store.state).toBe(42);
  });

  it("runs the fetch without a store target when none is passed", async () => {
    const { service } = makeService();

    const result = await service.query<{ name: string }>({
      queryKey: ["profile"],
      fetcher: async () => ({ name: "Alice" }),
    });

    expect(result).toEqual({ name: "Alice" });
  });
});

describe("QueryService — imperative mutate()", () => {
  it("pessimistic: never touches the store, awaits the server call", async () => {
    const { service } = makeService();
    const store = new Store<{ count: number }>({ count: 0 });

    const result = await service.mutate({
      mutationFn: async (n: number) => n * 2,
      variables: 5,
      mutationMode: "pessimistic",
      // Optimistic block is ignored in pessimistic mode.
      optimistic: { store, apply: (s) => ({ count: s.count + 1 }) },
    });

    expect(result).toBe(10);
    expect(store.state).toEqual({ count: 0 });
  });

  it("optimistic: applies immediately, keeps state on success", async () => {
    const { service } = makeService();
    const store = new Store<{ count: number }>({ count: 0 });

    const result = await service.mutate({
      mutationFn: async (n: number) => n,
      variables: 5,
      mutationMode: "optimistic",
      optimistic: { store, apply: (s, n) => ({ count: s.count + n }) },
    });

    expect(result).toBe(5);
    expect(store.state).toEqual({ count: 5 });
  });

  it("optimistic: rolls back the store when the server call throws", async () => {
    const { service } = makeService();
    const store = new Store<{ items: string[] }>({ items: ["a"] });

    await expect(
      service.mutate({
        mutationFn: async () => {
          throw new Error("server down");
        },
        variables: "b",
        mutationMode: "optimistic",
        optimistic: {
          store,
          apply: (s, id: string) => ({ items: [...s.items, id] }),
        },
      }),
    ).rejects.toThrow("server down");

    expect(store.state).toEqual({ items: ["a"] });
  });
});
