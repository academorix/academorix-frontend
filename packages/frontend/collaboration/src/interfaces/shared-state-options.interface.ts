/**
 * @file shared-state-options.interface.ts
 * Options for the shared state hook.
 *
 * @module @stackra/collaboration/interfaces
 * @category Interfaces
 */

/**
 * Configuration for the `useSharedState` hook.
 *
 * @typeParam T - The shape of the shared state object.
 *
 * @example
 * ```typescript
 * const options: SharedStateOptions<{ count: number }> = {
 *   initialState: { count: 0 },
 * };
 * ```
 */
export interface SharedStateOptions<T> {
  /** The initial state value used when no state exists yet. */
  initialState: T;
}
