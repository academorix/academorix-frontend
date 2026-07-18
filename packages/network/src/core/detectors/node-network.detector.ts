/**
 * @file node-network.detector.ts
 * @module @stackra/network/detectors
 * @description Node.js network detector using DNS resolution and polling.
 */

import type { INetworkDetector, INetworkStatus } from "@stackra/contracts";

// ============================================================================
// Node.js Network Detector
// ============================================================================

/**
 * Node.js network detector that checks connectivity by attempting DNS resolution.
 *
 * Uses periodic polling since Node.js has no native online/offline events.
 * Performs a DNS lookup to verify actual connectivity (not just interface status).
 *
 * @example
 * ```typescript
 * import { NetworkModule } from '@stackra/network';
 * import { NodeNetworkDetector } from '@stackra/network/detectors';
 *
 * NetworkModule.forRoot({
 *   detector: new NodeNetworkDetector({ pollIntervalMs: 10_000 }),
 * });
 * ```
 */
export class NodeNetworkDetector implements INetworkDetector {
  private readonly listeners: Set<(status: INetworkStatus) => void> = new Set();
  private readonly pollIntervalMs: number;
  private readonly dnsHost: string;
  private pollTimer?: ReturnType<typeof setInterval>;
  private lastOnline: boolean = true;

  /**
   * @param options - Configuration for the Node detector
   * @param options.pollIntervalMs - How often to check connectivity (default: 5000ms)
   * @param options.dnsHost - Host to resolve for connectivity check (default: 'dns.google')
   */
  public constructor(options: { pollIntervalMs?: number; dnsHost?: string } = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 5_000;
    this.dnsHost = options.dnsHost ?? "dns.google";
    this.startPolling();
  }

  /**
   * Synchronously return the last known online state.
   *
   * @returns `true` if the last DNS check succeeded
   */
  public isOnline(): boolean {
    return this.lastOnline;
  }

  /**
   * Perform an immediate DNS check and return the result.
   *
   * @returns Network status with online state
   */
  public async getStatus(): Promise<INetworkStatus> {
    const online = await this.checkConnectivity();
    this.lastOnline = online;

    return {
      isOnline: online,
      type: "ethernet",
    };
  }

  /**
   * Subscribe to network status changes.
   *
   * @param cb - Callback invoked when connectivity changes
   * @returns Unsubscribe function
   */
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    this.listeners.add(cb);

    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Stop polling and clean up.
   */
  public destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.listeners.clear();
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /**
   * Start the polling interval.
   */
  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      const online = await this.checkConnectivity();

      if (online !== this.lastOnline) {
        this.lastOnline = online;
        this.notifyAll({ isOnline: online, type: "ethernet" });
      }
    }, this.pollIntervalMs);

    // Don't prevent process exit
    if (this.pollTimer && typeof this.pollTimer === "object" && "unref" in this.pollTimer) {
      (this.pollTimer as NodeJS.Timeout).unref();
    }
  }

  /**
   * Check connectivity by performing a DNS lookup.
   *
   * @returns `true` if DNS resolution succeeds
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      const dns = await import("dns");
      return new Promise<boolean>((resolve) => {
        dns.lookup(this.dnsHost, (err) => {
          resolve(!err);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Notify all subscribers of a status change.
   */
  private notifyAll(status: INetworkStatus): void {
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
