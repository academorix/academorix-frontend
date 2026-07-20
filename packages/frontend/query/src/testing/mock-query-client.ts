/**
 * @file mock-query-client.ts
 * @module @stackra/query/testing
 * @description In-memory `IQueryClient` implementation for tests.
 *
 *   Mirrors the production `QueryService` shape (`fetch`,
 *   `invalidate`, `refetch`, `getData`, `setData`, `remove`, `keys`)
 *   with an added observability layer: every call is recorded on
 *   `.calls`, and `.getInvalidations(key)` returns how many times a
 *   key was invalidated — which is all a handler test typically
 *   needs to prove.
 *
 *   Tests that need real TanStack Query semantics (stale-time, gc,
 *   dedup) should instantiate a real `QueryClient` from
 *   `@tanstack/query-core` and wrap it in `QueryService` instead —
 *   this mock trades accuracy for inspectability.
 */

import type { IQueryClient } from "@stackra/contracts";

/** A recorded query-client call. */
export type RecordedQueryCall =
  | { kind: "fetch"; key: readonly unknown[] }
  | { kind: "invalidate"; key: readonly unknown[] }
  | { kind: "refetch"; key: readonly unknown[] }
  | { kind: "getData"; key: readonly unknown[] }
  | { kind: "setData"; key: readonly unknown[] }
  | { kind: "remove"; key: readonly unknown[] };

/** Serialize a query key to a stable string for `Map` lookup. */
function hashKey(key: readonly unknown[]): string {
  return JSON.stringify(key);
}

/**
 * In-memory query client for testing.
 *
 * @example
 * ```ts
 * const client = new MockQueryClient();
 * await client.fetch(['users', 1], async () => ({ id: 1 }));
 * await client.invalidate(['users', 1]);
 * expect(client.getInvalidations(['users', 1])).toBe(1);
 * expect(client.getData<{ id: number }>(['users', 1])?.id).toBe(1);
 * ```
 */
export class MockQueryClient implements IQueryClient {
  /** Recorded call log. */
  public readonly calls: RecordedQueryCall[] = [];

  /** Data table keyed by hashed key. */
  private readonly cache = new Map<string, unknown>();

  /** How many times each key was invalidated. */
  private readonly invalidations = new Map<string, number>();

  /** @inheritDoc */
  public async fetch<T = unknown>(
    key: readonly unknown[],
    fetcher: () => Promise<T>,
    _options?: { readonly staleTime?: number },
  ): Promise<T> {
    this.calls.push({ kind: "fetch", key: [...key] });
    const hash = hashKey(key);
    if (this.cache.has(hash)) {
      return this.cache.get(hash) as T;
    }
    const data = await fetcher();
    this.cache.set(hash, data);
    return data;
  }

  /** @inheritDoc */
  public async invalidate(key: readonly unknown[]): Promise<void> {
    const hash = hashKey(key);
    this.invalidations.set(hash, (this.invalidations.get(hash) ?? 0) + 1);
    // Match TanStack semantics — invalidating removes the cached data
    // so the next fetch runs the fetcher again.
    this.cache.delete(hash);
    this.calls.push({ kind: "invalidate", key: [...key] });
  }

  /** @inheritDoc */
  public async refetch<T = unknown>(key: readonly unknown[]): Promise<T | undefined> {
    this.calls.push({ kind: "refetch", key: [...key] });
    // The mock doesn't remember the last fetcher — tests that need
    // refetch semantics should call fetch again with an explicit
    // fetcher. Returns the cached value as of the last fetch.
    return this.cache.get(hashKey(key)) as T | undefined;
  }

  /** @inheritDoc */
  public getData<T = unknown>(key: readonly unknown[]): T | undefined {
    this.calls.push({ kind: "getData", key: [...key] });
    return this.cache.get(hashKey(key)) as T | undefined;
  }

  /** @inheritDoc */
  public setData<T = unknown>(key: readonly unknown[], data: T): void {
    this.cache.set(hashKey(key), data);
    this.calls.push({ kind: "setData", key: [...key] });
  }

  /** @inheritDoc */
  public remove(key: readonly unknown[]): void {
    this.cache.delete(hashKey(key));
    this.calls.push({ kind: "remove", key: [...key] });
  }

  /** @inheritDoc */
  public keys(): ReadonlyArray<readonly unknown[]> {
    return Array.from(this.cache.keys()).map((h) => JSON.parse(h) as readonly unknown[]);
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** How many times the given key has been invalidated. */
  public getInvalidations(key: readonly unknown[]): number {
    return this.invalidations.get(hashKey(key)) ?? 0;
  }

  /** Filter recorded calls by kind — sugar over `.calls.filter()`. */
  public callsOf<K extends RecordedQueryCall["kind"]>(
    kind: K,
  ): Array<Extract<RecordedQueryCall, { kind: K }>> {
    return this.calls.filter((c) => c.kind === kind) as Array<
      Extract<RecordedQueryCall, { kind: K }>
    >;
  }

  /** Drop every recorded call, cached value, and invalidation count. */
  public reset(): void {
    this.calls.length = 0;
    this.cache.clear();
    this.invalidations.clear();
  }
}
