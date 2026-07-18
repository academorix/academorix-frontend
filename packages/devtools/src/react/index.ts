/**
 * @file index.ts
 * @module @stackra/devtools/react
 * @description Public API for the `@stackra/devtools/react` subpath
 *   — the web shell entry point.
 *
 *   The one-liner `<Devtools />` is the canonical mount point for
 *   apps. Every other export is here for consumers who need to
 *   compose the shell manually (a custom app-provided host, a
 *   testing harness, or a package that ships its own bespoke
 *   overlay on top of the primitives).
 */

// ════════════════════════════════════════════════════════════════════
// One-liner mount
// ════════════════════════════════════════════════════════════════════
export { Devtools, type DevtoolsProps } from './devtools';

// ════════════════════════════════════════════════════════════════════
// Provider + contexts + hooks
// ════════════════════════════════════════════════════════════════════
export { DevtoolsProvider, type DevtoolsProviderProps } from './providers/devtools';
export {
  DevtoolsContext,
  DevtoolsInspectorContext,
  type IDevtoolsContextValue,
  type IDevtoolsInspectorContextValue,
} from './contexts';
export {
  useDevtoolsContext,
  useDevtoolsEnabled,
  useDevtoolsFrameState,
  useDevtoolsInspector,
  useDevtoolsAuthGuard,
  useDevtoolsPanel,
  useDevtoolsPanels,
  useDevtoolsSearch,
  useDevtoolsShortcut,
  type DevtoolsAuthDenyReason,
  type IUseDevtoolsAuthGuardResult,
  type IUseDevtoolsFrameStateResult,
  type IUseDevtoolsInspectorResult,
  type IUseDevtoolsPanelsResult,
  type IUseDevtoolsSearchResult,
} from './hooks';

// ════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════
export {
  ActionsPanel,
  DevtoolsInspectorOverlay,
  DevtoolsInspectorToolbar,
  DevtoolsLauncher,
  DevtoolsNavItem,
  DevtoolsNavRail,
  DevtoolsPanelEmpty,
  DevtoolsPanelFrame,
  DevtoolsPanelLocked,
  DevtoolsPanelView,
  DevtoolsPositionMenu,
  DevtoolsSearch,
  DevtoolsShell,
  OverviewPanel,
  type ActionsPanelProps,
  type DevtoolsInspectorOverlayProps,
  type DevtoolsInspectorToolbarProps,
  type DevtoolsLauncherProps,
  type DevtoolsNavItemProps,
  type DevtoolsNavRailProps,
  type DevtoolsPanelEmptyProps,
  type DevtoolsPanelFrameProps,
  type DevtoolsPanelLockedProps,
  type DevtoolsPanelViewProps,
  type DevtoolsPositionMenuProps,
  type DevtoolsSearchProps,
  type DevtoolsShellProps,
  type OverviewPanelProps,
} from './components';

// ════════════════════════════════════════════════════════════════════
// Built-in panels (contribution classes)
// ════════════════════════════════════════════════════════════════════
export { ActionsDevtoolsPanel, OverviewDevtoolsPanel } from './panels';

// ════════════════════════════════════════════════════════════════════
// Utilities
// ════════════════════════════════════════════════════════════════════
export { formatPanelBadge } from './utils';
