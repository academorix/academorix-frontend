/**
 * @file index.ts
 * @module @stackra/routing/react/devtools
 * @description Barrel for the routing devtools contributions.
 *
 *   Consumers wire these via `DevtoolsModule.forFeature([
 *     RoutingDevtoolsPanel, RoutingInspectorSource,
 *   ])` when `@stackra/devtools` is installed. `RoutingModule.forRoot`
 *   registers them automatically when the peer is present.
 */

export {
  RoutingDevtoolsPanel,
  RoutingDevtoolsPanelView,
  type IRoutingDevtoolsPanelViewProps,
} from "./routing-devtools-panel";
export { RoutingInspectorSource } from "./routing-inspector-source";
