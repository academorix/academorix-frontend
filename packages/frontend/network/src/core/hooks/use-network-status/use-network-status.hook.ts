/**
 * @file use-network-status.hook.ts
 * @module @stackra/network/core/hooks
 * @description React hook for reactive network monitoring.
 *   Lives in core because it uses only `useInject` (from container/react)
 *   and React primitives — works identically on web and native, so both
 *   the `react` and `native` subpaths re-export it.
 */

import { useState, useEffect } from "react";
import { useInject } from "@stackra/container/react";
import { NETWORK_SERVICE } from "@stackra/contracts";
import type { INetworkStatus } from "@stackra/contracts";
import type { NetworkService } from "@/core/services/network.service";
import type { UseNetworkStatusResult } from "@/core/interfaces";

/**
 * React hook that subscribes to network status changes.
 *
 * Uses the DI-managed {@link NetworkService} to provide reactive
 * network connectivity information to React components.
 *
 * @returns An object with `isOnline`, `status`, and `type`
 *
 * @example
 * ```tsx
 * import { useNetworkStatus } from '@stackra/network/react';
 *
 * function ConnectionBanner() {
 *   const { isOnline, type } = useNetworkStatus();
 *   if (!isOnline) return <Banner variant="warning">You are offline</Banner>;
 *   return <Text>Connected via {type}</Text>;
 * }
 * ```
 */
export function useNetworkStatus(): UseNetworkStatusResult {
  const networkService = useInject<NetworkService>(NETWORK_SERVICE);

  const [status, setStatus] = useState<INetworkStatus | null>(() => ({
    isOnline: networkService.isOnline(),
    type: undefined,
    downlinkSpeed: undefined,
  }));

  useEffect(() => {
    networkService.getStatus().then(setStatus);

    const unsubscribe = networkService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, [networkService]);

  return {
    isOnline: status?.isOnline ?? false,
    status,
    type: status?.type,
  };
}
