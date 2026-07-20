/**
 * @file devtools-panel-frame.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for {@link DevtoolsPanelFrame}.
 */

import type { IDevtoolsPanel } from "@stackra/contracts";

/** Props for {@link DevtoolsPanelFrame}. */
export interface DevtoolsPanelFrameProps {
  /** The panel to render — includes the view + gate + title. */
  readonly panel: IDevtoolsPanel;
}
