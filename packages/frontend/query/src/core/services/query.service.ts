/**
 * @file query.service.ts
 * @module @stackra/query/core/services
 * @description The imperative query service — DI-injectable facade
 *   over TanStack Query's `QueryClient`.
 *
 *   Wraps `@tanstack/query-core`'s `QueryClient` so:
 *
 *   - **DI-native.** Bound under both the `QueryService` class token
 *     and the `QUERY_CLIENT` contract token in `QueryModule.forRoot`.
 *     Consumers inject `QUERY_CLIENT` and use `IQueryClient` methods
 *     from anywhere (action handlers, SSR loaders, tests).
 *   - **Full TanStack Query cache.** Stale-time, gc-time, dedup,
 *     retry with backoff, devtools — all inherited from
 *     `QueryClient`.
 *   - **Stackra add-ons.** The three mutation modes (pessimistic /
 *     optimistic / undoable) sit on top, coordinated with
 *     `UndoableQueueService`. Realtime subscribe / publish primitives
 *     wrap `REALTIME_MANAGER` (optional peer).
 *
 *   The React hooks (`useQuery` / `useMutation` in `./react`) go
 *   through TanStack Query directly — this service is the imperative
 *   sibling for non-React contexts.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { Logger } from '@stackra/logger';
import type { Store } from '@tanstack/store';
import { QueryClient } from '@tanstack/query-core';
import {
  EVENT_EMITTER,
  REALTIME_MANAGER,
  STATE_EVENTS,
  UNDOABLE_QUEUE,
  type IEventEmitter,
  type ILiveEvent,
  type IQueryClient,
  type IRealtimeChannel,
  type IRealtimeConnection,
  type IRealtimeManager,
  type IUndoableQueue,
  type LiveEventType,
  type MutationMode,
} from '@stackra/contracts';

import { QUERY_CONFIG } from '../tokens/query.tokens';
import type { QueryModuleOptions } from '../interfaces/query-module-options.interface';

// ══════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════

/** Config accepted by `QueryService.query`. */
export interface QueryServiceQuery<S, TData = S> {
  /** Stable query key. */
  readonly queryKey: readonly unknown[];
  /** Async fetcher. Delegated to `queryClient.fetchQuery`. */
  readonly fetcher: () => Promise<TData>;
  /**
   * Optional target store — the fetched (and optionally selected)
   * value is written here on success. Callers that only want the
   * return value without side-effects can omit this.
   */
  readonly store?: Store<S>;
  /** Human-readable store name used to prefix emitted events. */
  readonly storeName?: string;
  /** Optional transform from raw data to store state. */
  readonly select?: (data: TData) => S;
  /** Optional stale-time override (ms). */
  readonly staleTime?: number;
}

/** Optimistic-update descriptor for `QueryService.mutate`. */
export interface QueryServiceOptimistic<TVars, TState> {
  /** Store to mutate optimistically. */
  readonly store: Store<TState>;
  /** Produce the next state from current + variables. */
  readonly apply: (current: TState, variables: TVars) => TState;
  /** Optional store name used as an event prefix. */
  readonly storeName?: string;
}

/** Options for `QueryService.mutate`. */
export interface QueryServiceMutation<TData, TVars, TState = unknown> {
  /** Async server call. */
  readonly mutationFn: (variables: TVars) => Promise<TData>;
  /** Mutation input. */
  readonly variables: TVars;
  /** Execution mode. Defaults to `QueryModule.defaultMutationMode`. */
  readonly mutationMode?: MutationMode;
  /** Optimistic store update (used by `optimistic` + `undoable`). */
  readonly optimistic?: QueryServiceOptimistic<TVars, TState>;
  /** Countdown for `undoable` mode. Defaults to `QueryModule.undoableTimeout`. */
  readonly undoableTimeout?: number;
  /** Optional undoable-queue toast label. */
  readonly undoableLabel?: string;
  /** Optional undoable-queue resource hint. */
  readonly resource?: string;
  /** Optional cancel-token registrar (undoable mode). */
  readonly onCancel?: (cancel: () => void) => void;
}

/** Options for `QueryService.subscribe`. */
export interface QueryServiceSubscribe {
  readonly channel: string;
  readonly onEvent: (event: ILiveEvent) => void;
  readonly types?: readonly LiveEventType[];
  readonly connection?: string;
  readonly private?: boolean;
}

/** Payload accepted by `QueryService.publish`. */
export type QueryServicePublishEvent = Omit<ILiveEvent, 'date'> & {
  readonly date?: Date;
};

/** Options controlling how `QueryService.publish` dispatches. */
export interface QueryServicePublishOptions {
  readonly connection?: string;
  readonly private?: boolean;
}

// ══════════════════════════════════════════════════════════════════
// Internals
// ══════════════════════════════════════════════════════════════════

/** Generate a unique mutation id. */
function genMutationId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ══════════════════════════════════════════════════════════════════
// Service
// ══════════════════════════════════════════════════════════════════

/**
 * DI-native facade over TanStack Query's `QueryClient` + Stackra
 * add-ons (mutation modes, realtime primitives).
 *
 * @example Non-React fetch (action handler / SSR loader)
 * ```typescript
 * const data = await queryService.fetch(['themes'], () => api.list());
 * // Cached in TanStack Query — subsequent calls dedupe.
 * ```
 *
 * @example Invalidation from an action handler
 * ```typescript
 * await queryService.invalidate(['themes']);
 * // Active `useQuery(['themes'], ...)` hooks refetch.
 * ```
 */
@Injectable()
export class QueryService implements IQueryClient {
  /** Scoped logger. */
  private readonly logger = new Logger(QueryService.name);

  /**
   * @param queryClient - The TanStack Query client. Bound by
   *   `QueryModule.forRoot` via a factory that reads the merged
   *   `QUERY_CONFIG`. Injected by class token — the container
   *   resolves it to the DI-registered instance.
   * @param eventEmitter - Optional event bus for query lifecycle events.
   * @param realtime - Optional realtime manager for live subscriptions.
   * @param undoable - Optional undoable queue for the `undoable` mutation mode.
   * @param config - Optional query-module defaults.
   */
  public constructor(
    private readonly queryClient: QueryClient,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
    @Optional() @Inject(REALTIME_MANAGER) private readonly realtime?: IRealtimeManager,
    @Optional() @Inject(UNDOABLE_QUEUE) private readonly undoable?: IUndoableQueue,
    @Optional()
    @Inject(QUERY_CONFIG)
    private readonly config?: Required<QueryModuleOptions>
  ) {}

  // ══════════════════════════════════════════════════════════════
  // IQueryClient — thin delegates to QueryClient
  // ══════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public async fetch<T = unknown>(
    key: readonly unknown[],
    fetcher: () => Promise<T>,
    options: { readonly staleTime?: number } = {}
  ): Promise<T> {
    return this.queryClient.fetchQuery({
      queryKey: key,
      queryFn: fetcher,
      ...(options.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
    });
  }

  /** @inheritDoc */
  public async invalidate(key: readonly unknown[]): Promise<void> {
    await this.queryClient.invalidateQueries({ queryKey: key });
  }

  /** @inheritDoc */
  public async refetch<T = unknown>(key: readonly unknown[]): Promise<T | undefined> {
    await this.queryClient.refetchQueries({ queryKey: key });
    return this.queryClient.getQueryData<T>(key);
  }

  /** @inheritDoc */
  public getData<T = unknown>(key: readonly unknown[]): T | undefined {
    return this.queryClient.getQueryData<T>(key);
  }

  /** @inheritDoc */
  public setData<T = unknown>(key: readonly unknown[], data: T): void {
    this.queryClient.setQueryData(key, data);
  }

  /** @inheritDoc */
  public remove(key: readonly unknown[]): void {
    this.queryClient.removeQueries({ queryKey: key });
  }

  /** @inheritDoc */
  public keys(): ReadonlyArray<readonly unknown[]> {
    return this.queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey);
  }

  /**
   * Escape hatch — return the raw `QueryClient` for advanced use
   * cases the `IQueryClient` surface doesn't cover (e.g. registering
   * mutation defaults, opening a `QueryObserver` manually).
   *
   * Prefer the typed methods above; only reach for this when the
   * TanStack Query API is needed directly.
   */
  public getQueryClient(): QueryClient {
    return this.queryClient;
  }

  // ══════════════════════════════════════════════════════════════
  // Imperative query — thin sugar over fetch()
  // ══════════════════════════════════════════════════════════════

  /**
   * Fetch once and (optionally) write the result to a state store.
   *
   * @remarks Delegates to `fetch()` (i.e. `queryClient.fetchQuery`)
   *   for the cached fetch, then applies `select` and writes the
   *   result to `config.store` if provided. This is the imperative
   *   counterpart to `useQuery(TOKEN, { fetcher, select })`.
   *
   * @param config - Query config (key, fetcher, optional store + select).
   * @returns The store state after the fetch — either the selected
   *   value, or the raw data cast to `S` when `select` is omitted.
   */
  public async query<S, TData = S>(config: QueryServiceQuery<S, TData>): Promise<S> {
    const storeName = config.storeName ?? 'unknown';

    this.emit(`${storeName}.${STATE_EVENTS.QUERY_STARTED}`, {
      queryKey: config.queryKey,
      isInitial: true,
    });

    try {
      const raw = await this.fetch<TData>(
        config.queryKey,
        config.fetcher,
        config.staleTime !== undefined ? { staleTime: config.staleTime } : undefined
      );
      const state = config.select ? config.select(raw) : (raw as unknown as S);
      if (config.store) {
        config.store.setState(() => state);
      }

      this.emit(`${storeName}.${STATE_EVENTS.QUERY_SUCCESS}`, {
        queryKey: config.queryKey,
        state,
      });

      return state;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit(`${storeName}.${STATE_EVENTS.QUERY_FAILED}`, {
        queryKey: config.queryKey,
        error: err,
      });
      throw err;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Imperative mutation — Stackra modes on top of the mutation fn
  // ══════════════════════════════════════════════════════════════

  /**
   * Run a server mutation with pessimistic / optimistic / undoable
   * semantics. TanStack Query's mutation surface is designed for
   * React hooks; imperative callers use this method to get the same
   * three modes without wiring an observer manually.
   *
   * @throws When `mutationMode: 'undoable'` and the user cancels via
   *   the undoable queue — the rejection reason is `'mutationCancelled'`.
   */
  public async mutate<TData, TVars, TState = unknown>(
    options: QueryServiceMutation<TData, TVars, TState>
  ): Promise<TData> {
    const mode: MutationMode =
      options.mutationMode ?? this.config?.defaultMutationMode ?? 'pessimistic';
    const timeout: number = options.undoableTimeout ?? this.config?.undoableTimeout ?? 5000;
    const mutId = genMutationId();

    // ── Pessimistic — server first, no local write ─────────────
    if (mode === 'pessimistic') {
      return options.mutationFn(options.variables);
    }

    // ── Optimistic — write locally, roll back on throw ─────────
    if (mode === 'optimistic') {
      const snapshot = this.applyOptimistic(options);
      if (snapshot) {
        this.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_STARTED}`, {
          mutationId: mutId,
          state: snapshot.store.state,
          previous: snapshot.previous,
        });
      }
      try {
        const result = await options.mutationFn(options.variables);
        if (snapshot) {
          this.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_SUCCESS}`, {
            mutationId: mutId,
            state: snapshot.store.state,
          });
        }
        return result;
      } catch (error: unknown) {
        if (snapshot) {
          this.rollback(snapshot);
          this.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_FAILED}`, {
            mutationId: mutId,
            error,
            rolledBackTo: snapshot.previous,
          });
        }
        throw error;
      }
    }

    // ── Undoable — optimistic + queue with countdown ───────────
    const snapshot = this.applyOptimistic(options);

    if (!this.undoable) {
      // No queue installed: degrade gracefully to optimistic-fire.
      try {
        return await options.mutationFn(options.variables);
      } catch (error: unknown) {
        if (snapshot) this.rollback(snapshot);
        throw error;
      }
    }

    options.onCancel?.(() => this.undoable?.cancel(mutId));

    let resolution: 'commit' | 'cancel';
    try {
      resolution = await this.undoable.add({
        id: mutId,
        ...(options.undoableLabel !== undefined ? { label: options.undoableLabel } : {}),
        ...(options.resource !== undefined ? { resource: options.resource } : {}),
        createdAt: new Date(),
        timeoutMs: timeout,
      });
    } catch (error: unknown) {
      if (snapshot) this.rollback(snapshot);
      throw error;
    }

    if (resolution === 'cancel') {
      if (snapshot) this.rollback(snapshot);
      throw new Error('mutationCancelled');
    }

    // resolution === 'commit' → fire the server call.
    try {
      return await options.mutationFn(options.variables);
    } catch (error: unknown) {
      if (snapshot) this.rollback(snapshot);
      throw error;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Realtime primitives — wraps @stackra/realtime
  // ══════════════════════════════════════════════════════════════

  /**
   * Open a realtime channel subscription.
   *
   * @returns An unsubscribe function. When the realtime peer isn't
   *   installed, returns a no-op unsubscribe (fail-soft).
   */
  public async subscribe(options: QueryServiceSubscribe): Promise<() => void> {
    if (!this.realtime) return () => undefined;

    let conn: IRealtimeConnection;
    try {
      conn = await this.realtime.connection(options.connection);
    } catch (error: unknown) {
      // Fail-soft: driver unavailable → no subscription.
      this.logger.warn('[QueryService.subscribe] connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return () => undefined;
    }

    const channel: IRealtimeChannel = options.private
      ? conn.privateChannel(options.channel)
      : conn.channel(options.channel);

    const effectiveTypes = options.types ?? (['*'] as readonly LiveEventType[]);
    const boundHandlers: Array<{ event: string; handler: (raw: unknown) => void }> = [];
    for (const eventType of effectiveTypes) {
      const handler = (raw: unknown): void => {
        const event: ILiveEvent = {
          channel: options.channel,
          type: eventType,
          payload:
            raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : { data: raw },
          date: new Date(),
        };
        try {
          options.onEvent(event);
        } catch {
          // Fail-soft — a broken subscriber can't take down the pipeline.
        }
      };
      channel.on(eventType, handler);
      boundHandlers.push({ event: eventType, handler });
    }

    return () => {
      for (const { event, handler } of boundHandlers) {
        channel.off(event, handler);
      }
    };
  }

  /**
   * Publish a live event via `channel.whisper(type, payload)` —
   * client-side broadcast that hits peers on the same channel.
   *
   * Fail-soft when the realtime peer isn't installed.
   */
  public async publish(
    event: QueryServicePublishEvent,
    options: QueryServicePublishOptions = {}
  ): Promise<void> {
    if (!this.realtime) return;
    const conn = await this.realtime.connection(options.connection);
    const channel = options.private
      ? conn.privateChannel(event.channel)
      : conn.channel(event.channel);
    channel.whisper(event.type, {
      ...event.payload,
      __stackraQueryEventDate: (event.date ?? new Date()).toISOString(),
    });
  }

  // ══════════════════════════════════════════════════════════════
  // Internal helpers
  // ══════════════════════════════════════════════════════════════

  /**
   * Apply an optimistic store update. Returns a snapshot the caller
   * can pass to `rollback` on failure — or `null` when no optimistic
   * config was supplied.
   */
  private applyOptimistic<TVars, TState>(
    options: QueryServiceMutation<unknown, TVars, TState>
  ): { store: Store<TState>; previous: TState; storeName: string } | null {
    const opt = options.optimistic;
    if (!opt) return null;
    const previous = opt.store.state;
    const next = opt.apply(previous, options.variables);
    opt.store.setState(() => next);
    return {
      store: opt.store,
      previous,
      storeName: opt.storeName ?? 'unknown',
    };
  }

  /** Restore a store to a previous state (rollback helper). */
  private rollback<TState>(snapshot: { store: Store<TState>; previous: TState }): void {
    snapshot.store.setState(() => snapshot.previous);
  }

  /** Fail-soft event emission. */
  private emit(name: string, payload: Record<string, unknown>): void {
    if (!this.eventEmitter) return;
    try {
      void this.eventEmitter.emit(name, payload);
    } catch (error: unknown) {
      this.logger.warn('[QueryService] event emit failed', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
