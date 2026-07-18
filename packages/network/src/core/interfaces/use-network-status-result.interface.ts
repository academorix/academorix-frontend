/**
 * @file use-network-status-result.interface.ts
 * @module @stackra/network/src/interfaces
 * @description UseNetworkStatusResult interface.
 */

import type { INetworkStatus } from "@stackra/contracts";

/**
 * Return value of the {@link useNetworkStatus} hook.
 */
export interface UseNetworkStatusResult {
  /** Whether the device is currently online. */
  readonly isOnline: boolean;

  /** The full network status object. */
  readonly status: INetworkStatus | null;

  /** The connection type (wifi, cellular, ethernet, unknown). */
  readonly type: INetworkStatus["type"];
}
