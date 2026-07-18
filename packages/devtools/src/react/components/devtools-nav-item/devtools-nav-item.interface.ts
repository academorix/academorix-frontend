/**
 * @file devtools-nav-item.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for {@link DevtoolsNavItem}.
 */

import type { IDevtoolsPanel } from '@stackra/contracts';

/** Props for {@link DevtoolsNavItem}. */
export interface DevtoolsNavItemProps {
  /** The panel this item represents. */
  readonly panel: IDevtoolsPanel;
  /** Whether the item is the currently-active panel. */
  readonly isActive: boolean;
  /** Fired when the item is pressed. */
  readonly onSelect: (panelId: string) => void;
}
