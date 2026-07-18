/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/devtools
 * @description Barrel for devtools interface contracts.
 */

export type {
  IDevtoolsAction,
  IDevtoolsAuthGate,
  IDevtoolsPanel,
  IDevtoolsView,
} from "./devtools-panel.interface";
export type { IDevtoolsPanelsRegistry } from "./devtools-panels-registry.interface";
export type {
  IDevtoolsInspectorRegion,
  IDevtoolsInspectorRegionSource,
  IDevtoolsInspectorRegistry,
} from "./devtools-inspector.interface";
export type { IDevtoolsPanelOptions } from "./devtools-panel-options.interface";
export type { IDevtoolsInspectorSourceOptions } from "./devtools-inspector-source-options.interface";
