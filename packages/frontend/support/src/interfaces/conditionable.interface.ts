/**
 * @file conditionable.interface.ts
 * @module @stackra/support/interfaces
 * @description Interface for conditionable classes.
 */

/** Interface for conditionable classes. */
export interface IConditionable {
  when<V>(
    value: V | (() => V),
    callback: (instance: this, value: V) => void,
    fallback?: (instance: this, value: V) => void,
  ): this;
  unless<V>(
    value: V | (() => V),
    callback: (instance: this, value: V) => void,
    fallback?: (instance: this, value: V) => void,
  ): this;
}
