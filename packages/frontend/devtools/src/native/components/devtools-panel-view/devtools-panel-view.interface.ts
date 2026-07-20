/**
 * @file devtools-panel-view.interface.ts
 * @module @stackra/devtools/native/components
 * @description Props for the native panel-view.
 */

import type { IDevtoolsPanel } from "@stackra/contracts";

/** Props for the native panel-view. */
export interface DevtoolsPanelViewProps {
  /** The panel to render. */
  readonly panel: IDevtoolsPanel;
}
