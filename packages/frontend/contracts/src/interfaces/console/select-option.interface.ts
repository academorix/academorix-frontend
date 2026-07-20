/**
 * @file select-option.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Shape of a single option in the `IConsoleOutput#select(...)`
 *   prompt. Generic over `T` because the returned value can be any type —
 *   a string, a numeric id, a full object.
 */

/**
 * A single selectable option in a `select` prompt.
 *
 * @typeParam T - The value type produced when this option is chosen.
 */
export interface ISelectOption<T = unknown> {
  /** The value handed back to the caller when this option is chosen. */
  readonly value: T;

  /** Human-readable label rendered next to the option. */
  readonly label: string;

  /** Optional secondary hint rendered dimly after the label. */
  readonly hint?: string;
}
