/**
 * @file devtools-nav-rail.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for {@link DevtoolsNavRail}.
 */

/** Props for {@link DevtoolsNavRail}. */
export interface DevtoolsNavRailProps {
  /** Active panel id (`null` when nothing selected). */
  readonly activePanelId: string | null;
  /** Called when the user selects a different panel. */
  readonly onSelect: (panelId: string) => void;
  /** Optional search query to filter the rail by. */
  readonly searchQuery?: string;
}
