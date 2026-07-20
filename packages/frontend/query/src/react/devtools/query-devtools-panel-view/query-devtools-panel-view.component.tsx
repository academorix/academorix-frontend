/**
 * @file query-devtools-panel-view.component.tsx
 * @module @stackra/query/react/devtools
 * @description React body of the `@stackra/devtools` query panel.
 *
 *   Renders three sections: (1) cache summary with total / stale /
 *   fetching / error chips; (2) mutation cache summary with pending
 *   + undoable-queue chips; (3) a list of the first 10 cached
 *   queries with their key + status + last-fetched timestamp.
 *
 *   TanStack Query's caches expose a `subscribe(listener)` API —
 *   `queryClient.getQueryCache().subscribe(...)` /
 *   `getMutationCache().subscribe(...)`. Each returns an unsubscribe
 *   function. We adapt them via `useSyncExternalStore` for
 *   tearing-free reads under concurrent React. The undoable queue
 *   exposes the same shape natively.
 */

import { type ReactElement, useCallback, useSyncExternalStore } from "react";
import { Card, Chip } from "@stackra/ui/react";
import type { QueryClient } from "@tanstack/query-core";
import type { IUndoableMutation } from "@stackra/contracts";

import type { QueryDevtoolsPanelViewProps } from "./query-devtools-panel-view.interface";

/** How many cached queries to preview. */
const QUERY_PREVIEW_LIMIT = 10;

/**
 * Snapshot of the query cache summary used by the view.
 *
 * Kept as an interface so React sees stable identity across
 * subscribe ticks — we return the same object reference when no
 * counters have changed via `keepAliveSnapshot`.
 */
interface QueryCacheSnapshot {
  readonly total: number;
  readonly stale: number;
  readonly fetching: number;
  readonly errored: number;
  readonly queries: readonly QueryPreviewRow[];
}

/** Per-query row displayed in the preview table. */
interface QueryPreviewRow {
  readonly hash: string;
  readonly key: string;
  readonly status: "pending" | "success" | "error" | "idle";
  readonly fetchStatus: "idle" | "fetching" | "paused";
  readonly isStale: boolean;
  readonly dataUpdatedAt: number;
}

/** Snapshot of the mutation cache summary. */
interface MutationCacheSnapshot {
  readonly total: number;
  readonly pending: number;
  readonly errored: number;
}

/** Empty snapshots used when the client / queue is absent. */
const EMPTY_QUERIES: QueryCacheSnapshot = Object.freeze({
  total: 0,
  stale: 0,
  fetching: 0,
  errored: 0,
  queries: Object.freeze([]) as readonly QueryPreviewRow[],
});
const EMPTY_MUTATIONS: MutationCacheSnapshot = Object.freeze({
  total: 0,
  pending: 0,
  errored: 0,
});

/**
 * Build a query cache snapshot from the current client state. Kept
 * outside the component so tests can call it directly if needed.
 */
function readQueryCache(client: QueryClient): QueryCacheSnapshot {
  const all = client.getQueryCache().getAll();
  let stale = 0;
  let fetching = 0;
  let errored = 0;
  for (const q of all) {
    if (q.isStale()) stale++;
    // fetchStatus is 'fetching' whenever the query is actually
    // hitting the network; status covers the last-known result.
    if (q.state.fetchStatus === "fetching") fetching++;
    if (q.state.status === "error") errored++;
  }
  const previews: QueryPreviewRow[] = [];
  for (const q of all.slice(0, QUERY_PREVIEW_LIMIT)) {
    let key: string;
    try {
      key = JSON.stringify(q.queryKey);
    } catch {
      // fail-soft — non-serialisable key falls back to a string.
      key = String(q.queryKey);
    }
    previews.push({
      hash: q.queryHash,
      key,
      status: q.state.status,
      fetchStatus: q.state.fetchStatus,
      isStale: q.isStale(),
      dataUpdatedAt: q.state.dataUpdatedAt,
    });
  }
  return {
    total: all.length,
    stale,
    fetching,
    errored,
    queries: previews,
  };
}

/**
 * Build a mutation cache snapshot from the current client state.
 */
function readMutationCache(client: QueryClient): MutationCacheSnapshot {
  const all = client.getMutationCache().getAll();
  let pending = 0;
  let errored = 0;
  for (const m of all) {
    if (m.state.status === "pending") pending++;
    if (m.state.status === "error") errored++;
  }
  return {
    total: all.length,
    pending,
    errored,
  };
}

/**
 * Subscribe to the query cache. Uses `useSyncExternalStore` — each
 * emit rebuilds a snapshot; identity flips when any counter changes.
 */
function useQueryCache(client: QueryClient | undefined): QueryCacheSnapshot {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      if (!client) return () => undefined;
      return client.getQueryCache().subscribe(() => cb());
    },
    [client],
  );
  const getSnapshot = useCallback(
    () => (client ? readQueryCache(client) : EMPTY_QUERIES),
    [client],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to the mutation cache. Same shape as {@link useQueryCache}.
 */
function useMutationCache(client: QueryClient | undefined): MutationCacheSnapshot {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      if (!client) return () => undefined;
      return client.getMutationCache().subscribe(() => cb());
    },
    [client],
  );
  const getSnapshot = useCallback(
    () => (client ? readMutationCache(client) : EMPTY_MUTATIONS),
    [client],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to the undoable-mutation queue's pending list.
 */
function useUndoableQueue(
  queue: QueryDevtoolsPanelViewProps["undoable"],
): readonly IUndoableMutation[] {
  const subscribe = useCallback(
    (cb: () => void): (() => void) => {
      if (!queue) return () => undefined;
      return queue.subscribe(() => cb());
    },
    [queue],
  );
  const getSnapshot = useCallback(
    () => (queue ? queue.getPending() : (EMPTY_PENDING as readonly IUndoableMutation[])),
    [queue],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Frozen empty pending list — stable identity for the null-queue path. */
const EMPTY_PENDING: readonly IUndoableMutation[] = Object.freeze([]);

/**
 * Map a TanStack query status to a HeroUI `Chip` variant. Kept pure
 * so chip identity is stable.
 */
function statusVariant(
  status: "pending" | "success" | "error" | "idle",
): "primary" | "secondary" | "soft" | "tertiary" {
  switch (status) {
    case "pending":
      return "primary";
    case "success":
      return "soft";
    case "error":
      return "tertiary";
    case "idle":
    default:
      return "secondary";
  }
}

/**
 * Format a `dataUpdatedAt` timestamp as a short relative label.
 */
function formatFetchedAt(ms: number): string {
  if (!ms) return "never";
  const diff = Date.now() - ms;
  if (diff < 1_000) return "now";
  if (diff < 60_000) return `${Math.floor(diff / 1_000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

/**
 * The query devtools panel body.
 *
 * @param props - See {@link QueryDevtoolsPanelViewProps}.
 * @returns The panel body — cache summary + query preview + undoable
 *   pending list.
 */
export function QueryDevtoolsPanelView({
  queryClient,
  undoable,
}: QueryDevtoolsPanelViewProps): ReactElement {
  const queries = useQueryCache(queryClient);
  const mutations = useMutationCache(queryClient);
  const pending = useUndoableQueue(undoable);

  if (!queryClient && !undoable) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>Query client not available</Card.Title>
            <Card.Description>
              Wire <code>QueryModule.forRoot()</code> to see live TanStack Query cache stats here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-foreground text-base font-semibold">Query</h3>
        <p className="text-muted text-xs">
          Live TanStack Query cache stats + Stackra&apos;s undoable-mutation queue.
        </p>
      </header>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-center gap-2">
            <Card.Title className="text-sm">Query cache</Card.Title>
            <Chip size="sm" variant="secondary">
              <Chip.Label>{queries.total} cached</Chip.Label>
            </Chip>
            <Chip size="sm" variant={queries.fetching > 0 ? "primary" : "secondary"}>
              <Chip.Label>{queries.fetching} fetching</Chip.Label>
            </Chip>
            <Chip size="sm" variant="secondary">
              <Chip.Label>{queries.stale} stale</Chip.Label>
            </Chip>
            <Chip size="sm" variant={queries.errored > 0 ? "tertiary" : "secondary"}>
              <Chip.Label>{queries.errored} errored</Chip.Label>
            </Chip>
          </div>
          <Card.Description>
            {queries.total > 0
              ? `First ${Math.min(queries.total, QUERY_PREVIEW_LIMIT)} keys shown below.`
              : "No cached queries yet."}
          </Card.Description>
        </Card.Header>
        {queries.queries.length > 0 ? (
          <Card.Content>
            <ul className="flex flex-col gap-1 text-sm">
              {queries.queries.map((q) => (
                <li key={q.hash} className="flex items-center justify-between gap-2">
                  <code className="truncate text-xs">{q.key}</code>
                  <span className="text-muted flex items-center gap-2">
                    <Chip size="sm" variant={statusVariant(q.status)}>
                      <Chip.Label>{q.status}</Chip.Label>
                    </Chip>
                    <span className="text-xs">{formatFetchedAt(q.dataUpdatedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card.Content>
        ) : null}
      </Card>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-center gap-2">
            <Card.Title className="text-sm">Mutations</Card.Title>
            <Chip size="sm" variant="secondary">
              <Chip.Label>{mutations.total} total</Chip.Label>
            </Chip>
            <Chip size="sm" variant={mutations.pending > 0 ? "primary" : "secondary"}>
              <Chip.Label>{mutations.pending} in flight</Chip.Label>
            </Chip>
            <Chip size="sm" variant={mutations.errored > 0 ? "tertiary" : "secondary"}>
              <Chip.Label>{mutations.errored} errored</Chip.Label>
            </Chip>
            <Chip size="sm" variant={pending.length > 0 ? "primary" : "secondary"}>
              <Chip.Label>{pending.length} undoable</Chip.Label>
            </Chip>
          </div>
          <Card.Description>
            TanStack Query&apos;s live mutation cache plus Stackra&apos;s countdown queue for{" "}
            <code>mutationMode: &apos;undoable&apos;</code>.
          </Card.Description>
        </Card.Header>
        {pending.length > 0 ? (
          <Card.Content>
            <ul className="flex flex-col gap-1 text-sm">
              {pending.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="text-foreground truncate">{m.label ?? m.resource ?? m.id}</span>
                  <span className="text-muted text-xs">
                    <code>{m.timeoutMs}ms</code>
                  </span>
                </li>
              ))}
            </ul>
          </Card.Content>
        ) : null}
      </Card>
    </div>
  );
}
