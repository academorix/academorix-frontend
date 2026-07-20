/**
 * @file use-mutation.hook.ts
 * @module @stackra/query/react/hooks/use-mutation
 * @description React mutation hook — thin wrapper over
 *   `@tanstack/react-query`'s `useMutation` with Stackra's three
 *   execution modes layered on top.
 *
 *   The three modes map to three UX shapes (identical semantics to
 *   Refine's `mutationMode`):
 *
 *   - **`pessimistic`** — wait for the server response before
 *     writing anything locally. Traditional loading state; safest
 *     for destructive writes. Default when the module doesn't
 *     override it.
 *   - **`optimistic`** — apply the optimistic store update
 *     immediately; roll it back if `mutationFn` throws. Best UX for
 *     high-latency links.
 *   - **`undoable`** — apply the optimistic store update
 *     immediately, then enqueue the actual `mutationFn` behind
 *     `UndoableQueueService`. A toast subscribes to the queue and
 *     lets the user cancel; on `commit` the mutation fires, on
 *     `cancel` the store rolls back.
 *
 *   TanStack Query owns the mutation state (isPending, isError,
 *   data, error, reset) and the retry / gc semantics. Everything
 *   else (mode branching, optimistic rollback, undoable queue) is
 *   wrapped around it.
 */

import { useCallback, useMemo, useRef } from "react";
import { useOptionalInject } from "@stackra/container/react";
import { useMutation as useTanstackMutation, useQueryClient } from "@tanstack/react-query";
import type { Store } from "@tanstack/store";
import type { QueryClient } from "@tanstack/query-core";
import {
  EVENT_EMITTER,
  STATE_EVENTS,
  UNDOABLE_QUEUE,
  type IEventEmitter,
  type IUndoableQueue,
  type MutationMode,
} from "@stackra/contracts";
import { StateRegistry } from "@stackra/state";
import { QUERY_CONFIG } from "@/core/tokens/query.tokens";
import type { QueryModuleOptions } from "@/core/interfaces/query-module-options.interface";

/**
 * Optimistic store-update configuration for `useMutation`.
 *
 * @typeParam TVariables - The mutation input variables.
 * @typeParam TState - The target store's state shape.
 */
export interface UseMutationOptimistic<TVariables, TState> {
  /** Store to mutate optimistically. */
  store: Store<TState>;
  /** Produce the next store state from the current state and the variables. */
  apply: (current: TState, variables: TVariables) => TState;
}

/**
 * Options for `useMutation`.
 *
 * @typeParam TData - The result type returned by the mutation.
 * @typeParam TVariables - The input variables type.
 * @typeParam TState - The optimistic store's state shape (when used).
 */
export interface UseMutationOptions<TData = unknown, TVariables = void, TState = unknown> {
  /** Async function that performs the server write. */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Execution mode. Defaults to `QueryModule.forRoot`'s
   * `defaultMutationMode`, which defaults to `'pessimistic'`.
   */
  mutationMode?: MutationMode;

  /**
   * Countdown (ms) before an `undoable` mutation fires. Ignored for
   * other modes. Defaults to the module's `undoableTimeout`.
   */
  undoableTimeout?: number;

  /**
   * Called when `mutationMode` is `'undoable'` — receives a
   * `cancel()` function the caller wires to the undo affordance
   * (typically a toast button). The queue drives the countdown; the
   * user calls `cancel()` to abort before it elapses.
   */
  onCancel?: (cancel: () => void) => void;

  /**
   * Optional label surfaced by the undoable-queue subscribers
   * (toasts). Ignored in `'pessimistic'` / `'optimistic'`.
   */
  undoableLabel?: string;

  /**
   * Optional resource hint attached to the undoable queue entry.
   * Ignored in `'pessimistic'` / `'optimistic'`.
   */
  resource?: string;

  /** Optional optimistic store update — used by `'optimistic'` and `'undoable'`. */
  optimistic?: UseMutationOptimistic<TVariables, TState>;

  /**
   * Optional list of query keys to invalidate on success. Each key
   * is passed to `queryClient.invalidateQueries({ queryKey })`.
   */
  invalidateKeys?: ReadonlyArray<readonly unknown[]>;

  /** Called on success. */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /** Called on error (after any optimistic rollback). */
  onError?: (error: Error, variables: TVariables) => void;

  /** Called after the mutation settles (success or error). */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

/**
 * Result of `useMutation`.
 *
 * @typeParam TData - The result type.
 * @typeParam TVariables - The input variables type.
 */
export interface UseMutationResult<TData = unknown, TVariables = void> {
  /** Trigger the mutation (fire-and-forget). */
  mutate: (variables: TVariables) => void;
  /** Trigger the mutation and await the result. */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Whether the mutation is in progress. */
  isPending: boolean;
  /** Whether the mutation errored. */
  isError: boolean;
  /** Whether the mutation succeeded. */
  isSuccess: boolean;
  /** Whether the mutation hasn't been triggered yet. */
  isIdle: boolean;
  /** The error (null if none). */
  error: Error | null;
  /** The mutation result data. */
  data: TData | undefined;
  /** Reset the mutation state to idle. */
  reset: () => void;
}

/** Unique mutation id (undoable queue entries + event correlation). */
function genMutationId(): string {
  return `mut_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Perform a server mutation with pessimistic / optimistic /
 * undoable execution modes.
 *
 * @example Pessimistic (default)
 * ```typescript
 * const { mutate, isPending } = useMutation({
 *   mutationFn: (creds: Credentials) => authService.login(creds),
 * });
 * ```
 *
 * @example Optimistic store write with rollback
 * ```typescript
 * const { mutate } = useMutation({
 *   mutationFn: (next: ThemeState) => api.saveTheme(next),
 *   mutationMode: 'optimistic',
 *   optimistic: { store: themeStore, apply: (_, next) => next },
 * });
 * ```
 *
 * @example Undoable "Gmail undo send" pattern
 * ```typescript
 * const { mutate } = useMutation({
 *   mutationFn: (id: string) => api.deleteThread(id),
 *   mutationMode: 'undoable',
 *   undoableTimeout: 5000,
 *   undoableLabel: 'Thread deleted',
 *   optimistic: {
 *     store: threadsStore,
 *     apply: (s, id) => ({ ...s, items: s.items.filter(t => t.id !== id) }),
 *   },
 *   onCancel: (cancel) => showUndoToast({ onUndo: cancel }),
 * });
 * ```
 */
export function useMutation<TData = unknown, TVariables = void, TState = unknown>(
  options: UseMutationOptions<TData, TVariables, TState>,
): UseMutationResult<TData, TVariables> {
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);
  const registry = useOptionalInject<StateRegistry>(StateRegistry);
  const defaults = useOptionalInject<Required<QueryModuleOptions>>(QUERY_CONFIG);
  const undoableQueue = useOptionalInject<IUndoableQueue>(UNDOABLE_QUEUE);
  const queryClient: QueryClient = useQueryClient();

  const effectiveMode: MutationMode =
    options.mutationMode ?? defaults?.defaultMutationMode ?? "pessimistic";
  const effectiveTimeout: number = options.undoableTimeout ?? defaults?.undoableTimeout ?? 5000;

  // Snapshot the last-successful rollback state so a delayed
  // `undoable` cancel path can still restore even after the mutation
  // Fn has been re-entered.
  const optimisticRef = useRef<{
    store: Store<TState>;
    previous: TState;
  } | null>(null);

  const applyOptimistic = useCallback(
    (
      variables: TVariables,
    ): { store: Store<TState>; previous: TState; storeName: string } | null => {
      const opt = options.optimistic;
      if (!opt) return null;
      const previous = opt.store.state;
      const storeName = registry?.getNameByToken(Symbol()) ?? "unknown";
      const next = opt.apply(previous, variables);
      opt.store.setState(() => next);
      return { store: opt.store, previous, storeName };
    },
    [options.optimistic, registry],
  );

  const rollback = useCallback((snapshot: { store: Store<TState>; previous: TState }): void => {
    snapshot.store.setState(() => snapshot.previous);
  }, []);

  // Build the composed mutationFn that applies mode logic on top of
  // the caller's mutationFn. TanStack Query's useMutation runs this
  // one function and tracks the result state.
  const composedMutationFn = useMemo(
    () =>
      async (variables: TVariables): Promise<TData> => {
        const mutId = genMutationId();

        // ── Pessimistic — no local write ─────────────────
        if (effectiveMode === "pessimistic") {
          return options.mutationFn(variables);
        }

        // ── Optimistic — write locally, roll back on throw ──
        if (effectiveMode === "optimistic") {
          const snapshot = applyOptimistic(variables);
          optimisticRef.current = snapshot;
          if (snapshot) {
            events?.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_STARTED}`, {
              mutationId: mutId,
            });
          }
          try {
            const result = await options.mutationFn(variables);
            optimisticRef.current = null;
            if (snapshot) {
              events?.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_SUCCESS}`, {
                mutationId: mutId,
              });
            }
            return result;
          } catch (error: unknown) {
            if (snapshot) rollback(snapshot);
            optimisticRef.current = null;
            if (snapshot) {
              events?.emit(`${snapshot.storeName}.${STATE_EVENTS.MUTATE_FAILED}`, {
                mutationId: mutId,
                error,
              });
            }
            throw error;
          }
        }

        // ── Undoable — optimistic + countdown queue ─────
        const snapshot = applyOptimistic(variables);
        optimisticRef.current = snapshot;

        if (!undoableQueue) {
          // No queue installed — degrade to optimistic-fire.
          try {
            const result = await options.mutationFn(variables);
            optimisticRef.current = null;
            return result;
          } catch (error: unknown) {
            if (snapshot) rollback(snapshot);
            optimisticRef.current = null;
            throw error;
          }
        }

        options.onCancel?.(() => undoableQueue.cancel(mutId));

        let resolution: "commit" | "cancel";
        try {
          resolution = await undoableQueue.add({
            id: mutId,
            ...(options.undoableLabel !== undefined ? { label: options.undoableLabel } : {}),
            ...(options.resource !== undefined ? { resource: options.resource } : {}),
            createdAt: new Date(),
            timeoutMs: effectiveTimeout,
          });
        } catch (error: unknown) {
          if (snapshot) rollback(snapshot);
          optimisticRef.current = null;
          throw error;
        }

        if (resolution === "cancel") {
          if (snapshot) rollback(snapshot);
          optimisticRef.current = null;
          throw new Error("mutationCancelled");
        }

        try {
          const result = await options.mutationFn(variables);
          optimisticRef.current = null;
          return result;
        } catch (error: unknown) {
          if (snapshot) rollback(snapshot);
          optimisticRef.current = null;
          throw error;
        }
      },
    [effectiveMode, effectiveTimeout, applyOptimistic, rollback, events, undoableQueue, options],
  );

  // TanStack Query does the heavy lifting from here — state, retry,
  // reset, isPending etc.
  const mutation = useTanstackMutation<TData, Error, TVariables>({
    mutationFn: composedMutationFn,
    onSuccess: (data, variables) => {
      // Invalidate any keys the caller asked for.
      if (options.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          void queryClient.invalidateQueries({ queryKey: [...key] });
        }
      }
      options.onSuccess?.(data, variables);
      options.onSettled?.(data, null, variables);
    },
    onError: (error, variables) => {
      options.onError?.(error, variables);
      options.onSettled?.(undefined, error, variables);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    isIdle: mutation.isIdle,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
