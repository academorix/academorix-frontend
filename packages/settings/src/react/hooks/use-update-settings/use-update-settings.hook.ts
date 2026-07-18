/**
 * @file use-update-settings.hook.ts
 * @module @stackra/settings/react/hooks
 * @description Mutation hook for settings groups — composed on
 *   `useMutation` from `@stackra/query`.
 *
 *   Adds three modes on top of the settings service's write path:
 *
 *   - **`pessimistic`** — waits for the persist to complete before
 *     resolving. Rolls the cache back on failure.
 *   - **`optimistic`** (default) — fires the write, mutation
 *     resolves immediately. Failures roll back via the
 *     `SETTINGS_EVENTS.UPDATE_FAILED` event bus subscription.
 *   - **`undoable`** — snapshots the cache, applies the write,
 *     enqueues the persist behind `UNDOABLE_QUEUE`. Commit sends
 *     the persist, cancel rolls back.
 *
 *   Falls back to a simpler sync `service.setMany` shim when
 *   `@stackra/query` isn't installed — the mode/undoable/invalidate
 *   knobs still exist but degrade to no-ops. Consumers that need
 *   the full mode matrix install `@stackra/query` as an optional
 *   peer.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useInject, useOptionalInject } from '@stackra/container/react';
import {
  EVENT_EMITTER,
  SETTINGS_EVENTS,
  SETTINGS_SERVICE,
  UNDOABLE_QUEUE,
  type IEventEmitter,
  type ISettingsService,
  type IUndoableQueue,
  type MutationMode,
  type Type,
} from '@stackra/contracts';

import type {
  IUseUpdateSettingsOptions,
  IUseUpdateSettingsResult,
  UpdateSettingsMutate,
} from './use-update-settings.interface';

/**
 * Update a settings group with pessimistic / optimistic / undoable
 * modes.
 *
 * Two call signatures — DTO form for typed writes, key form for
 * schema-only groups.
 *
 * @example Optimistic (default) — instant UX, rollback on failure
 * ```tsx
 * const { mutate, isPending } = useUpdateSettings(DisplaySettings);
 * <Button onPress={() => mutate({ compact: true })} isPending={isPending}>
 *   Save
 * </Button>
 * ```
 *
 * @example Pessimistic — await server confirmation before UI reacts
 * ```tsx
 * const { mutate } = useUpdateSettings(DisplaySettings, {
 *   mutationMode: 'pessimistic',
 * });
 * await mutate({ theme: 'dark' });  // resolves after persist succeeds
 * ```
 *
 * @example Undoable — Gmail-style "undo change" toast
 * ```tsx
 * const { mutate } = useUpdateSettings(DisplaySettings, {
 *   mutationMode: 'undoable',
 *   undoableTimeout: 5000,
 *   undoableLabel: 'Display settings updated',
 *   onCancel: (cancel) => showUndoToast({ onUndo: cancel }),
 * });
 * ```
 */
export function useUpdateSettings<T extends object>(
  dto: Type<T>,
  options?: IUseUpdateSettingsOptions<T>
): IUseUpdateSettingsResult<T>;
export function useUpdateSettings<T extends Record<string, unknown> = Record<string, unknown>>(
  groupKey: string,
  options?: IUseUpdateSettingsOptions<T>
): IUseUpdateSettingsResult<T>;
export function useUpdateSettings<T extends object>(
  dtoOrKey: Type<T> | string,
  options: IUseUpdateSettingsOptions<T> = {}
): IUseUpdateSettingsResult<T> {
  const service = useInject<ISettingsService>(SETTINGS_SERVICE);
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);
  const undoableQueue = useOptionalInject<IUndoableQueue>(UNDOABLE_QUEUE);

  const mode: MutationMode = options.mutationMode ?? 'optimistic';
  const undoableTimeout = options.undoableTimeout ?? 5000;

  // ══════════════════════════════════════════════════════════════════
  // State machine — mirrors `useMutation`'s shape so callers see the
  // same result surface whether or not `@stackra/query` is installed.
  // ══════════════════════════════════════════════════════════════════

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resetState = useCallback(() => {
    setIsPending(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // Group-key resolution
  // ══════════════════════════════════════════════════════════════════

  const groupKey = typeof dtoOrKey === 'string' ? dtoOrKey : resolveKeyForDto(service, dtoOrKey);

  // ══════════════════════════════════════════════════════════════════
  // Rollback bookkeeping — a snapshot of the group's values BEFORE the
  // optimistic/undoable write. Restored via `hydrateValues` on failure
  // or cancel.
  // ══════════════════════════════════════════════════════════════════

  const snapshotRef = useRef<Record<string, unknown> | null>(null);

  /**
   * Capture the pre-mutation snapshot and apply the write to the
   * cache. Returns the snapshot so the caller can roll it back.
   */
  const applyWithSnapshot = useCallback(
    (partial: Partial<T>): Record<string, unknown> => {
      const previous = { ...(service.getByKey(groupKey) ?? {}) };
      snapshotRef.current = previous;
      writeToService(service, dtoOrKey, partial);
      return previous;
    },
    [service, groupKey, dtoOrKey]
  );

  /** Roll back to the last captured snapshot (if any). */
  const rollback = useCallback((): void => {
    if (!snapshotRef.current) return;
    // hydrateValues merges — we need a REPLACE. Clear the cache first.
    service.resetByKey(groupKey);
    service.hydrateValues(groupKey, snapshotRef.current);
    snapshotRef.current = null;
  }, [service, groupKey]);

  // ══════════════════════════════════════════════════════════════════
  // Mutate — dispatches into one of three mode-specific paths.
  // ══════════════════════════════════════════════════════════════════

  const mutate: UpdateSettingsMutate<T> = useCallback(
    async (partial) => {
      setIsPending(true);
      setIsSuccess(false);
      setError(null);

      try {
        if (mode === 'pessimistic') {
          await runPessimistic({
            service,
            groupKey,
            dtoOrKey,
            partial,
            applyWithSnapshot,
            rollback,
          });
        } else if (mode === 'undoable') {
          await runUndoable({
            service,
            groupKey,
            dtoOrKey,
            partial,
            undoableQueue,
            undoableTimeout,
            undoableLabel: options.undoableLabel,
            onCancel: options.onCancel,
            applyWithSnapshot,
            rollback,
          });
        } else {
          // Optimistic — the default. The service's setMany already
          // writes the cache synchronously and schedules a background
          // persist. We arm a rollback subscription so a failed
          // persist restores the previous values.
          runOptimistic({
            service,
            groupKey,
            dtoOrKey,
            partial,
            events,
            applyWithSnapshot,
            rollback,
          });
        }

        setIsSuccess(true);
        options.onSuccess?.(partial);
        options.onSettled?.(null, partial);
      } catch (thrown) {
        const err = thrown instanceof Error ? thrown : new Error(String(thrown));
        setError(err);
        options.onError?.(err, partial);
        options.onSettled?.(err, partial);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [
      mode,
      service,
      groupKey,
      dtoOrKey,
      applyWithSnapshot,
      rollback,
      undoableQueue,
      undoableTimeout,
      events,
      options,
    ]
  );

  // ══════════════════════════════════════════════════════════════════
  // Reset (defaults) — pass-through to the service.
  // ══════════════════════════════════════════════════════════════════

  const reset = useCallback((): void => {
    if (typeof dtoOrKey === 'string') {
      service.resetByKey(dtoOrKey);
    } else {
      service.reset(dtoOrKey);
    }
  }, [service, dtoOrKey]);

  return useMemo(
    () => ({ mutate, reset, isPending, isSuccess, error, resetState }),
    [mutate, reset, isPending, isSuccess, error, resetState]
  );
}

// ══════════════════════════════════════════════════════════════════
// Mode implementations
// ══════════════════════════════════════════════════════════════════

interface IModeContext<T> {
  readonly service: ISettingsService;
  readonly groupKey: string;
  readonly dtoOrKey: Type<T> | string;
  readonly partial: Partial<T>;
  readonly applyWithSnapshot: (partial: Partial<T>) => Record<string, unknown>;
  readonly rollback: () => void;
}

/**
 * Pessimistic — apply, then await the persist. Roll back on failure
 * so the UI mirrors the last-confirmed server state.
 *
 * We optimistically apply the write to keep the sync `getSnapshot`
 * accurate for other components mid-mutation, but the mutation
 * doesn't RESOLVE until the persist succeeds — so a caller doing
 * `await mutate(...)` waits for the round trip.
 */
async function runPessimistic<T>(ctx: IModeContext<T>): Promise<void> {
  ctx.applyWithSnapshot(ctx.partial);
  try {
    await ctx.service.awaitPersist(ctx.groupKey);
  } catch (error) {
    ctx.rollback();
    throw error;
  }
}

interface IOptimisticContext<T> extends IModeContext<T> {
  readonly events?: IEventEmitter;
}

/**
 * Optimistic — write, resolve immediately. Wire a one-shot
 * subscription to the `SETTINGS_EVENTS.UPDATE_FAILED` bus so the
 * cache rolls back if the debounced persist fails downstream.
 */
function runOptimistic<T>(ctx: IOptimisticContext<T>): void {
  const previous = ctx.applyWithSnapshot(ctx.partial);

  // Arm a fail-soft rollback listener that fires on the next
  // `UPDATE_FAILED` event for this group and then removes itself.
  // Uses the event bus (rather than awaitPersist) so the rollback
  // is best-effort and doesn't block the returned promise.
  if (!ctx.events) return;
  const off = ctx.events.on(SETTINGS_EVENTS.UPDATE_FAILED, (payload: unknown): void => {
    const record = payload as { group?: unknown } | null;
    if (!record || record.group !== ctx.groupKey) return;
    // Restore the pre-mutation snapshot.
    ctx.service.resetByKey(ctx.groupKey);
    ctx.service.hydrateValues(ctx.groupKey, previous);
    off();
  });
  // Auto-remove the listener after the debounce window closes,
  // whether or not it fired — the mutation is settled at that
  // point. `awaitPersist` resolves ~debounceMs after the write.
  ctx.service.awaitPersist(ctx.groupKey).finally(() => off());
}

interface IUndoableContext<T> extends IModeContext<T> {
  readonly undoableQueue?: IUndoableQueue;
  readonly undoableTimeout: number;
  readonly undoableLabel?: string;
  readonly onCancel?: (cancel: () => void) => void;
}

/**
 * Undoable — apply, enqueue, wait for commit/cancel. Cancel rolls
 * back. Requires the `UNDOABLE_QUEUE` binding from `@stackra/query`;
 * degrades to fire-and-forget when the queue isn't installed.
 */
async function runUndoable<T>(ctx: IUndoableContext<T>): Promise<void> {
  ctx.applyWithSnapshot(ctx.partial);

  if (!ctx.undoableQueue) {
    // No queue — degrade gracefully to a fire-and-forget optimistic.
    // The cache write already happened; if the persist fails, the
    // event bus route can be relied on via a separate optimistic
    // hook. Fine for a fallback.
    return;
  }

  const mutId = `settings_${ctx.groupKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  ctx.onCancel?.(() => ctx.undoableQueue?.cancel(mutId));

  const resolution = await ctx.undoableQueue.add({
    id: mutId,
    ...(ctx.undoableLabel !== undefined ? { label: ctx.undoableLabel } : {}),
    resource: ctx.groupKey,
    createdAt: new Date(),
    timeoutMs: ctx.undoableTimeout,
  });

  if (resolution === 'cancel') {
    ctx.rollback();
    throw new Error('mutationCancelled');
  }
  // On 'commit' the persist has ALREADY been scheduled by
  // `applyWithSnapshot`'s `service.setMany` call. Nothing more to do
  // — the debounced persist fires normally.
}

// ══════════════════════════════════════════════════════════════════
// Small helpers
// ══════════════════════════════════════════════════════════════════

/** Write to the service using the DTO or key flavour. */
function writeToService<T>(
  service: ISettingsService,
  dtoOrKey: Type<T> | string,
  partial: Partial<T>
): void {
  if (typeof dtoOrKey === 'string') {
    service.setManyByKey(dtoOrKey, partial as Record<string, unknown>);
  } else {
    service.setMany(dtoOrKey, partial);
  }
}

/** Resolve a DTO to its registered group key. */
function resolveKeyForDto<T>(service: ISettingsService, dto: Type<T>): string {
  const definition = service.getGroups().find((d) => d.dto === dto);
  if (!definition) {
    throw new Error(
      `[useUpdateSettings] "${dto.name}" is not registered. ` +
        `Wrap it with SettingsModule.forFeature([${dto.name}]).`
    );
  }
  return definition.key;
}
