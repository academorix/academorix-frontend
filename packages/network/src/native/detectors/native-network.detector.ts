/**
 * @file native-network.detector.ts
 * @module @stackra/network/native/detectors
 * @description React Native network detector using @react-native-community/netinfo.
 */

import { Injectable } from "@stackra/container";
import type { INetworkDetector, INetworkStatus } from "@stackra/contracts";

/**
 * React Native network detector using @react-native-community/netinfo.
 *
 * Wraps NetInfo to provide the INetworkDetector contract for mobile apps.
 * Supports connection type detection, reach detection, and change subscriptions.
 *
 * @example
 * ```typescript
 * import { NativeNetworkModule } from '@stackra/network/native';
 *
 * // NativeNetworkModule.forRoot() automatically provides NativeNetworkDetector
 * @Module({
 *   imports: [NativeNetworkModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class NativeNetworkDetector implements INetworkDetector {
  private online: boolean = true;
  private readonly listeners: Set<(status: INetworkStatus) => void> = new Set();
  private unsubscribeNetInfo?: () => void;

  public constructor() {
    this.initialize();
  }

  /**
   * Synchronously return cached online state.
   *
   * @returns `true` if device has connectivity
   */
  public isOnline(): boolean {
    return this.online;
  }

  /**
   * Fetch current network state from NetInfo.
   *
   * @returns Full network status including connection type
   */
  public async getStatus(): Promise<INetworkStatus> {
    try {
      const NetInfo = await this.getNetInfo();
      const state = await NetInfo.fetch();

      this.online = state.isConnected ?? false;

      return {
        isOnline: this.online,
        type: this.mapConnectionType(state.type),
        downlinkSpeed: undefined,
      };
    } catch {
      return { isOnline: this.online, type: "unknown" };
    }
  }

  /**
   * Subscribe to connectivity changes.
   *
   * @param cb - Callback invoked on each state change
   * @returns Unsubscribe function
   */
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Clean up NetInfo subscription.
   */
  public destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = undefined;
    }
    this.listeners.clear();
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Initialize NetInfo subscription for status change monitoring.
   */
  private async initialize(): Promise<void> {
    try {
      const NetInfo = await this.getNetInfo();

      this.unsubscribeNetInfo = NetInfo.addEventListener((state: any) => {
        const wasOnline = this.online;
        this.online = state.isConnected ?? false;

        if (wasOnline !== this.online) {
          const status: INetworkStatus = {
            isOnline: this.online,
            type: this.mapConnectionType(state.type),
          };

          for (const listener of this.listeners) {
            listener(status);
          }
        }
      });

      // Get initial state
      const initialState = await NetInfo.fetch();
      this.online = initialState.isConnected ?? true;
    } catch {
      // NetInfo not available — assume online
      this.online = true;
    }
  }

  /**
   * Map NetInfo connection type to the standard INetworkStatus type.
   *
   * @param type - NetInfo connection type string
   * @returns Normalized connection type
   */
  private mapConnectionType(type: string): INetworkStatus["type"] {
    switch (type) {
      case "wifi":
        return "wifi";
      case "cellular":
        return "cellular";
      case "ethernet":
        return "ethernet";
      default:
        return "unknown";
    }
  }

  /**
   * Dynamically import @react-native-community/netinfo.
   *
   * @returns NetInfo module
   */
  private async getNetInfo(): Promise<any> {
    return await import("@react-native-community/netinfo");
  }
}
