/**
 * @file index.ts
 * @module @stackra/devtools/react/hooks
 * @description Barrel for the devtools React hooks.
 */

export { useDevtoolsContext } from './use-devtools-context.hook';
export { useDevtoolsPanels, type IUseDevtoolsPanelsResult } from './use-devtools-panels.hook';
export { useDevtoolsPanel } from './use-devtools-panel.hook';
export {
  useDevtoolsFrameState,
  type IUseDevtoolsFrameStateResult,
} from './use-devtools-frame-state.hook';
export { useDevtoolsShortcut } from './use-devtools-shortcut.hook';
export { useDevtoolsEnabled } from './use-devtools-enabled.hook';
export { useDevtoolsSearch, type IUseDevtoolsSearchResult } from './use-devtools-search.hook';
export {
  useDevtoolsInspector,
  type IUseDevtoolsInspectorResult,
} from './use-devtools-inspector.hook';
export {
  useDevtoolsAuthGuard,
  type IUseDevtoolsAuthGuardResult,
  type DevtoolsAuthDenyReason,
} from './use-devtools-auth-guard.hook';
