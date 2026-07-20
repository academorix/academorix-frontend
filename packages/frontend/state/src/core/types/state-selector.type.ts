/**
 * @file state-selector.type.ts
 * @module @stackra/state/core/types
 * @description Selector type used by store read hooks.
 */

/**
 * Selector function that extracts a value from a state object.
 *
 * @typeParam S - The full state shape.
 * @typeParam R - The selected return type.
 */
export type StateSelector<S, R> = (state: S) => R;
