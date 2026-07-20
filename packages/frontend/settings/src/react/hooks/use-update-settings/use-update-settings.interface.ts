/**
 * @file use-update-settings.interface.ts
 * @module @stackra/settings/react/hooks
 * @description Public option + result shapes exposed by
 *   `useUpdateSettings`.
 *
 *   The three modes match `@stackra/query`'s `useMutation` — the hook
 *   composes it under the hood so settings writes share the same
 *   pessimistic / optimistic / undoable semantics as every other
 *   mutation in the app.
 */

import type { MutationMode } from "@stackra/contracts";

/** Mutation function shape returned by `useUpdateSettings`. */
export type UpdateSettingsMutate<T> = (partial: Partial<T>) => Promise<void>;

/**
 * Options accepted by `useUpdateSettings`.
 *
 * All fields are optional — defaults keep the hook backward
 * compatible with the pre-alignment API (fire-and-forget
 * optimistic).
 *
 * @typeParam T - The DTO / values shape being mutated.
 */
export interface IUseUpdateSettingsOptions<T> {
  /**
   * Execution mode. Defaults to `'optimistic'` because that is the
   * shape the settings service already implements natively — cache
   * write, background persist, failures surfaced on the event bus.
   *
   * - `'pessimistic'` — the returned `mutate` promise awaits the
   *   persist. Rolls the cache back if the persist rejects.
   * - `'optimistic'` — mutate resolves immediately after the cache
   *   write. Failures roll back automatically on the
   *   `SETTINGS_EVENTS.UPDATE_FAILED` event.
   * - `'undoable'` — snapshot the cache, apply the change, enqueue
   *   with `UNDOABLE_QUEUE` for `undoableTimeout` ms; commit sends
   *   the persist, cancel rolls back.
   */
  readonly mutationMode?: MutationMode;

  /**
   * Countdown (ms) for `'undoable'` mode. Ignored otherwise.
   * Defaults to `QueryModule`'s `undoableTimeout` (5000 ms).
   */
  readonly undoableTimeout?: number;

  /**
   * Optional label surfaced by the undoable-queue subscribers
   * (toasts). Ignored outside `'undoable'` mode.
   */
  readonly undoableLabel?: string;

  /**
   * Called on `'undoable'` mode with a `cancel()` function the
   * caller wires to the undo affordance (typically a toast button).
   */
  readonly onCancel?: (cancel: () => void) => void;

  /**
   * Query keys to invalidate on successful mutation — passed
   * through to `useMutation` from `@stackra/query`. Each key is
   * fed to `queryClient.invalidateQueries({ queryKey })`.
   */
  readonly invalidateKeys?: ReadonlyArray<readonly unknown[]>;

  /** Called on success (post-persist for pessimistic, post-write for optimistic). */
  readonly onSuccess?: (partial: Partial<T>) => void;

  /** Called on error (after any rollback). */
  readonly onError?: (error: Error, partial: Partial<T>) => void;

  /** Called after the mutation settles (success or error). */
  readonly onSettled?: (error: Error | null, partial: Partial<T>) => void;
}

/**
 * Reactive result object exposing the mutation surface + its
 * lifecycle state.
 *
 * @typeParam T - The DTO / values shape being mutated.
 */
export interface IUseUpdateSettingsResult<T> {
  /** Fire a batched update against the group. */
  readonly mutate: UpdateSettingsMutate<T>;

  /** Reset the group to its declared defaults. */
  readonly reset: () => void;

  /** Whether a `mutate` is currently in flight. */
  readonly isPending: boolean;

  /**
   * Whether the last mutation succeeded. Cleared by the next call
   * to `mutate` or `resetState`.
   */
  readonly isSuccess: boolean;

  /**
   * Error from the last failed mutation, or `null` when the last
   * mutation succeeded (or none has run yet).
   */
  readonly error: Error | null;

  /** Clear `isPending` / `isSuccess` / `error`. */
  readonly resetState: () => void;
}
