/**
 * @file index.ts
 * @module @stackra/devtools/core/interfaces
 * @description Barrel for package-owned interfaces.
 *
 *   Contract shapes (`IDevtoolsPanel`, `IDevtoolsPanelsRegistry`,
 *   etc.) live in `@stackra/contracts` and MUST be imported from
 *   there — this barrel exports only devtools-package-owned inputs
 *   (module options, decorator options, frame state).
 */

export type {
  IDevtoolsModuleAsyncOptions,
  IDevtoolsModuleOptions,
  IDevtoolsShortcut,
} from "./devtools-module-options.interface";
export type { IDevtoolsFrameState } from "./devtools-frame-state.interface";
export type { IDevtoolsPanelOptions } from "./devtools-panel-options.interface";
export type { IDevtoolsInspectorSourceOptions } from "./devtools-inspector-source-options.interface";
export type { IDevtoolsShellProps } from "./devtools-shell-props.interface";
