/**
 * @file devtools-inspector-context-value.interface.ts
 * @module @stackra/devtools/react/contexts
 * @description Shape of the value carried by
 *   {@link DevtoolsInspectorContext}.
 */

/**
 * Inspector-context value.
 */
export interface IDevtoolsInspectorContextValue {
  /** Whether the inspector overlay is active. */
  readonly enabled: boolean;
  /** Enable or disable the overlay. */
  readonly setEnabled: (next: boolean) => void;
  /** Toggle the overlay. */
  readonly toggle: () => void;
}
