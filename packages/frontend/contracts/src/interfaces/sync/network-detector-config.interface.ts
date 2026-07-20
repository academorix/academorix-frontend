/**
 * @file network-detector-config.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Configuration for the sync-owned network detector.
 */

import type { IConnectivityCheck } from "./connectivity-check.interface";

/**
 * Configuration slice for the sync package's network detector.
 *
 * The detector layers a debounced connectivity probe on top of the platform
 * signal so quick flaps do not thrash the operation queue.
 */
export interface INetworkDetectorConfig {
  /** Custom connectivity probe layered on top of the platform signal. */
  customCheck?: IConnectivityCheck;

  /** Debounce time in milliseconds. Defaults to 1000. */
  debounceTime?: number;

  /** Whether to enable the custom connectivity probe. Defaults to `false`. */
  enableCustomChecks?: boolean;

  /** Interval between custom connectivity probes in milliseconds. Defaults to 30000. */
  customCheckInterval?: number;
}
