/**
 * @file network-status.interface.ts
 * @module @stackra/contracts/interfaces/network
 * @description Network connectivity status shape.
 */

/** Connection transport type, when known. */
export type NetworkConnectionType = "wifi" | "cellular" | "ethernet" | "unknown";

/**
 * A snapshot of the device's network connectivity.
 */
export interface INetworkStatus {
  /** Whether the device currently has connectivity. */
  isOnline: boolean;
  /** Connection transport type, when detectable. */
  type?: NetworkConnectionType;
  /** Downlink speed estimate in Mbps (Network Information API), when available. */
  downlinkSpeed?: number;
}

/**
 * Alias for {@link INetworkStatus} — kept for consumers that reference the
 * non-`I`-prefixed name.
 */
export type NetworkStatus = INetworkStatus;
