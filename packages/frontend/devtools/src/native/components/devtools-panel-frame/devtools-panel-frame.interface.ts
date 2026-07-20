/**
 * @file devtools-panel-frame.interface.ts
 * @module @stackra/devtools/native/components
 * @description Props for the native {@link DevtoolsPanelFrame}.
 */

import type { IDevtoolsPanel } from "@stackra/contracts";

/** Props for the native {@link DevtoolsPanelFrame}. */
export interface DevtoolsPanelFrameProps {
  /** The panel to render — includes the view + gate + title. */
  readonly panel: IDevtoolsPanel;
}
