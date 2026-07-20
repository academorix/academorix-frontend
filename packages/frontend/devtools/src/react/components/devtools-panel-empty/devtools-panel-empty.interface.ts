/**
 * @file devtools-panel-empty.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for {@link DevtoolsPanelEmpty}.
 */

/**
 * Props for {@link DevtoolsPanelEmpty}.
 */
export interface DevtoolsPanelEmptyProps {
  /** Empty-state title. Defaults to "No panel selected". */
  readonly title?: string;
  /** Empty-state description. */
  readonly description?: string;
}
