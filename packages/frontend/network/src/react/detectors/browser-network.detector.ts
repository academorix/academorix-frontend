/**
 * @file browser-network.detector.ts
 * @module @stackra/network/react/detectors
 * @description Browser-based network detector using Navigator API and Network Information API.
 *   Lives in the react subpath because it depends on browser-only globals (window, navigator).
 */

import { Injectable } from "@stackra/container";
import type { INetworkDetector, INetworkStatus } from "@stackra/contracts";

// ============================================================================
// Browser Network Detector
// ============================================================================

/**
 * Browser-based network detector using `navigator.onLine` and the
 * Network Information API (where available).
 *
 * Falls back gracefully when the Network Information API is not supported.
 * Emits changes via `online`/`offline` window events and `change` events
 * on `navigator.connection` (Chromium browsers).
 *
 * SSR guard: if `typeof window === 'undefined'`, all methods return safe
 * defaults (online = true, type = unknown) and subscriptions are no-ops.
 *
 * @example
 * ```typescript
 * import { WebNetworkModule } from '@stackra/network/react';
 *
 * // WebNetworkModule.forRoot() automatically provides BrowserNetworkDetector
 * @Module({
 *   imports: [WebNetworkModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class BrowserNetworkDetector implements INetworkDetector {
  private readonly listeners: Set<(status: INetworkStatus) => void> = new Set();
  private readonly onlineHandler: () => void;
  private readonly offlineHandler: () => void;
  private readonly connectionChangeHandler?: () => void;
  private readonly isSSR: boolean;

  public constructor() {
    this.isSSR = typeof window === "undefined";

    this.onlineHandler = () => this.notifyAll();
    this.offlineHandler = () => this.notifyAll();

    if (!this.isSSR) {
      window.addEventListener("online", this.onlineHandler);
      window.addEventListener("offline", this.offlineHandler);

      // Network Information API (Chromium)
      const connection = this.getConnection();
      if (connection) {
        this.connectionChangeHandler = () => this.notifyAll();
        connection.addEventListener("change", this.connectionChangeHandler);
      }
    }
  }

  /**
   * Synchronously check if the browser reports connectivity.
   *
   * Returns `true` in SSR environments where `navigator` is unavailable.
   *
   * @returns `true` if `navigator.onLine` is true or in SSR mode
   */
  public isOnline(): boolean {
    if (this.isSSR) return true;
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  }

  /**
   * Get the full network status including connection type and speed.
   *
   * Returns safe defaults in SSR environments (online, unknown type).
   *
   * @returns Current network status with type and downlink speed when available
   */
  public async getStatus(): Promise<INetworkStatus> {
    if (this.isSSR) {
      return { isOnline: true, type: "unknown", downlinkSpeed: undefined };
    }
    return this.buildStatus();
  }

  /**
   * Subscribe to network status changes.
   *
   * Returns a no-op unsubscribe function in SSR environments.
   *
   * @param cb - Callback invoked on each change
   * @returns Unsubscribe function
   */
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    if (this.isSSR) {
      return () => {};
    }
    this.listeners.add(cb);

    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Clean up all event listeners.
   */
  public destroy(): void {
    if (!this.isSSR) {
      window.removeEventListener("online", this.onlineHandler);
      window.removeEventListener("offline", this.offlineHandler);

      const connection = this.getConnection();
      if (connection && this.connectionChangeHandler) {
        connection.removeEventListener("change", this.connectionChangeHandler);
      }
    }

    this.listeners.clear();
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Build the current network status from browser APIs.
   *
   * @returns Current network status, falls back to safe defaults on error
   */
  private buildStatus(): INetworkStatus {
    try {
      const connection = this.getConnection();

      return {
        isOnline: this.isOnline(),
        type: this.resolveType(connection),
        downlinkSpeed: connection?.downlink,
      };
    } catch {
      return { isOnline: true, type: "unknown", downlinkSpeed: undefined };
    }
  }

  /**
   * Resolve the connection type from the Network Information API.
   */
  private resolveType(connection: NetworkInformation | null): INetworkStatus["type"] {
    if (!connection) return "unknown";

    switch (connection.type) {
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
   * Get the Navigator.connection object (Network Information API).
   */
  private getConnection(): NetworkInformation | null {
    if (typeof navigator === "undefined") return null;
    return (navigator as NavigatorWithConnection).connection ?? null;
  }

  /**
   * Notify all subscribers of the current status.
   */
  private notifyAll(): void {
    const status = this.buildStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch {
        // Fail-open: never crash the event loop for a subscriber error
      }
    }
  }
}

// ── Type Augmentation ───────────────────────────────────────────────────────

/** Network Information API types (not in all TypeScript lib versions). */
interface NetworkInformation extends EventTarget {
  readonly type?: string;
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
}

interface NavigatorWithConnection {
  readonly connection?: NetworkInformation;
}
