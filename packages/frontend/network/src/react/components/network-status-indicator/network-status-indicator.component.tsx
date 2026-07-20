/**
 * @file network-status-indicator.component.tsx
 * @module @stackra/network/react/components
 * @description NetworkStatusIndicator — renders the current connection state
 *   as a HeroUI `Chip`. Built on `@stackra/ui` (HeroUI / HeroUI Pro).
 */

import { Chip } from "@stackra/ui/react";

import { useNetworkStatus } from "@/core/hooks";
import type { NetworkStatusIndicatorLabels, NetworkStatusIndicatorProps } from "@/react/interfaces";

/** Default labels — override via the `labels` prop for i18n. */
const DEFAULT_LABELS: Required<NetworkStatusIndicatorLabels> = {
  offline: "Offline",
  slow: "Slow",
  wifi: "Wi-Fi",
  cellular: "Cellular",
  ethernet: "Ethernet",
  unknown: "Online",
};

/** Map the derived status to a HeroUI chip color. */
const STATUS_COLOR = {
  online: "success",
  slow: "warning",
  offline: "danger",
} as const;

/**
 * NetworkStatusIndicator — displays a HeroUI `Chip` reflecting the current
 * connection type / speed. Color follows the state (online → success,
 * slow → warning, offline → danger) and a `data-status` attribute is emitted
 * for styling hooks.
 *
 * @param props - Component props (`size`, `variant`, `labels`, `className`)
 * @returns A `Chip` element showing the current network state
 *
 * @example
 * ```tsx
 * import { NetworkStatusIndicator } from '@stackra/network/react';
 *
 * <NetworkStatusIndicator size="sm" />
 * ```
 */
export function NetworkStatusIndicator({
  className,
  labels,
  size = "sm",
  variant = "soft",
}: NetworkStatusIndicatorProps): React.ReactElement {
  const { isOnline, status } = useNetworkStatus();
  const merged: Required<NetworkStatusIndicatorLabels> = { ...DEFAULT_LABELS, ...(labels ?? {}) };

  const downlinkSpeed = status?.downlinkSpeed;
  const isSlow = isOnline && downlinkSpeed !== undefined && downlinkSpeed < 1;
  const dataStatus: keyof typeof STATUS_COLOR = !isOnline ? "offline" : isSlow ? "slow" : "online";

  const label = resolveLabel(isOnline, isSlow, status?.type, merged);

  return (
    <Chip
      color={STATUS_COLOR[dataStatus]}
      variant={variant}
      size={size}
      className={className}
      data-status={dataStatus}
    >
      {label}
    </Chip>
  );
}

/**
 * Resolve the chip label from the derived network state.
 *
 * @param isOnline - Whether the device is online
 * @param isSlow - Whether the connection is slow
 * @param type - Connection type, when known
 * @param labels - Resolved label strings
 * @returns The label to render
 */
function resolveLabel(
  isOnline: boolean,
  isSlow: boolean,
  type: string | undefined,
  labels: Required<NetworkStatusIndicatorLabels>,
): string {
  if (!isOnline) return labels.offline;
  if (isSlow) return labels.slow;
  switch (type) {
    case "wifi":
      return labels.wifi;
    case "cellular":
      return labels.cellular;
    case "ethernet":
      return labels.ethernet;
    default:
      return labels.unknown;
  }
}
