/**
 * @file devtools-panel-view.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for {@link DevtoolsPanelView}.
 */

import type { IDevtoolsPanel } from '@stackra/contracts';

/** Props for {@link DevtoolsPanelView}. */
export interface DevtoolsPanelViewProps {
  /** The panel whose `view` should be rendered. */
  readonly panel: IDevtoolsPanel;
}
