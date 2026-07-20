/**
 * @file multiselect-option.interface.ts
 * @module @stackra/contracts/interfaces/console
 * @description Shape of a single option in the `IConsoleOutput#multiselect(...)`
 *   prompt.
 */

/**
 * A single selectable option in a `multiselect` prompt.
 *
 * @typeParam T - The value type produced when this option is chosen.
 */
export interface IMultiselectOption<T = unknown> {
  /** The value handed back to the caller when this option is chosen. */
  readonly value: T;

  /** Human-readable label rendered next to the option. */
  readonly label: string;

  /** Optional secondary hint rendered dimly after the label. */
  readonly hint?: string;

  /** Whether this option starts pre-selected. Defaults to `false`. */
  readonly initialSelected?: boolean;
}
