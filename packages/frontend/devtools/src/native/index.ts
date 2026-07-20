/**
 * @file index.ts
 * @module @stackra/devtools/native
 * @description Public API for `@stackra/devtools/native` — the
 *   React Native shell entry point.
 *
 *   Ships:
 *
 *   - `<Devtools />` — the one-liner mount that pulls the
 *     provider + launcher pill + bottom-sheet shell into the
 *     tree.
 *   - `DevtoolsProvider` + `DevtoolsContext` — the DI-backed
 *     context that carries the resolved registries + services
 *     down the tree.
 *   - `DevtoolsLauncher`, `DevtoolsShell`, `DevtoolsPanelFrame`,
 *     `DevtoolsPanelView`, `DevtoolsPanelLocked` — the shell
 *     components.
 *   - `OverviewPanel`, `ActionsPanel` — the built-in panel
 *     bodies.
 *   - `OverviewNativeDevtoolsPanel`, `ActionsNativeDevtoolsPanel`
 *     — the panel classes registered by the provider on mount.
 *   - `useNativeDevtoolsContext`, `useNativeDevtoolsEnabled`,
 *     `useNativeDevtoolsFrameState`, `useNativeDevtoolsPanels` —
 *     shell hooks. Consumer feature packages read these to
 *     surface state in their own native panels.
 *
 *   Cross-package contract vocabulary (`DEVTOOLS_REGISTRY`,
 *   `IDevtoolsPanel`, `DEVTOOLS_EVENTS`, …) MUST be imported
 *   directly from `@stackra/contracts`. This subpath ships only
 *   package-owned symbols per
 *   `.kiro/steering/contract-reexports.md`.
 */

import "reflect-metadata";

// ════════════════════════════════════════════════════════════════════
// Top-level wrapper
// ════════════════════════════════════════════════════════════════════
export { Devtools, type DevtoolsProps } from "./devtools";

// ════════════════════════════════════════════════════════════════════
// Provider + context
// ════════════════════════════════════════════════════════════════════
export { DevtoolsProvider, type DevtoolsProviderProps } from "./providers";
export { DevtoolsContext } from "./contexts";

// ════════════════════════════════════════════════════════════════════
// Components — sheet + panels
// ════════════════════════════════════════════════════════════════════
export {
  ActionsPanel,
  DevtoolsLauncher,
  DevtoolsPanelFrame,
  DevtoolsPanelLocked,
  DevtoolsPanelView,
  DevtoolsShell,
  OverviewPanel,
  type ActionsPanelProps,
  type DevtoolsAuthDenyReason,
  type DevtoolsLauncherProps,
  type DevtoolsPanelFrameProps,
  type DevtoolsPanelLockedProps,
  type DevtoolsPanelViewProps,
  type DevtoolsShellProps,
  type OverviewPanelProps,
} from "./components";

// ════════════════════════════════════════════════════════════════════
// Built-in native panels — registered by DevtoolsProvider
// ════════════════════════════════════════════════════════════════════
export { ActionsNativeDevtoolsPanel, OverviewNativeDevtoolsPanel } from "./panels";

// ════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════
export {
  useNativeDevtoolsContext,
  useNativeDevtoolsEnabled,
  useNativeDevtoolsFrameState,
  useNativeDevtoolsPanels,
  type IUseNativeDevtoolsFrameStateResult,
  type IUseNativeDevtoolsPanelsResult,
} from "./hooks";

// ════════════════════════════════════════════════════════════════════
// Interfaces — package-owned only
// ════════════════════════════════════════════════════════════════════
export type { IDevtoolsNativeContextValue } from "./interfaces";
