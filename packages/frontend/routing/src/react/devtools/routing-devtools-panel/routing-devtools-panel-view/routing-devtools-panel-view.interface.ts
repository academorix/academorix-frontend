/**
 * @file routing-devtools-panel-view.interface.ts
 * @module @stackra/routing/react/devtools/routing-devtools-panel
 * @description Props for the routing devtools panel body.
 */

import type { RouteRegistryService } from "@/core/services/route-registry.service";

/**
 * Props accepted by {@link RoutingDevtoolsPanelView}.
 */
export interface IRoutingDevtoolsPanelViewProps {
  /**
   * The `RouteRegistryService` — passed through by the panel class
   * so tests can feed a fixture without wiring the full DI graph.
   */
  readonly registry: RouteRegistryService;
}
