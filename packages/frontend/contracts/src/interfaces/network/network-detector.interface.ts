/**
 * @file network-detector.interface.ts
 * @module @stackra/contracts/interfaces/network
 * @description Platform-specific network detector contract.
 */

import type { INetworkStatus } from "./network-status.interface";

/**
 * A platform-specific connectivity detector.
 *
 * Implemented by the browser (`navigator.onLine` + Network Information API),
 * React Native (NetInfo), and Node (DNS polling) detectors.
 */
export interface INetworkDetector {
  /** Synchronously return the last-known online state. */
  isOnline(): boolean;
  /** Resolve the full current network status. */
  getStatus(): Promise<INetworkStatus>;
  /** Subscribe to status changes; returns an unsubscribe function. */
  subscribe(cb: (status: INetworkStatus) => void): () => void;
  /** Release listeners/timers. Optional — not every detector holds resources. */
  destroy?(): void;
}
