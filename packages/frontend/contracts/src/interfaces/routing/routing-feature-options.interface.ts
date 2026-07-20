/**
 * @file routing-feature-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape for `RoutingModule.forFeature(...)`.
 */

import type { IRouteRecord } from "./route-record.interface";

/**
 * Options for `RoutingModule.forFeature({...})`. Every feature module
 * that contributes routes uses this shape.
 */
export interface IRoutingFeatureOptions {
  /**
   * Feature name — used to key the seed-loader token and disambiguate
   * failure messages.
   */
  readonly name: string;

  /** Route records the feature contributes to the tree. */
  readonly routes: readonly IRouteRecord[];
}
