/**
 * @file mock-network-service.ts
 * @module @stackra/network/testing
 * @description In-memory `NetworkService`-compatible mock for tests.
 *
 *   Holds an in-memory status, notifies subscribers, and exposes a
 *   `simulateStatus()` hook so tests can drive online/offline transitions
 *   deterministically — no real detector, timers, or browser globals.
 */

import type { INetworkStatus } from "@stackra/contracts";

/**
 * In-memory network service for testing.
 *
 * Mirrors the `NetworkService` public surface (`isOnline`, `getStatus`,
 * `subscribe`, `destroy`) so it can be registered under `NETWORK_SERVICE`
 * in tests.
 */
export class MockNetworkService {
  /** Current in-memory status. */
  private status: INetworkStatus = { isOnline: true, type: "unknown" };

  /** Registered status listeners. */
  private readonly listeners = new Set<(status: INetworkStatus) => void>();

  public constructor(initial?: Partial<INetworkStatus>) {
    if (initial) this.status = { ...this.status, ...initial };
  }

  /** Synchronously return the current online state. */
  public isOnline(): boolean {
    return this.status.isOnline;
  }

  /** Resolve the current status. */
  public async getStatus(): Promise<INetworkStatus> {
    return { ...this.status };
  }

  /** Subscribe to status changes; returns an unsubscribe function. */
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /** Drop every listener. */
  public destroy(): void {
    this.listeners.clear();
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /**
   * Drive a status transition and notify every subscriber.
   *
   * @param next - Full or partial status to merge over the current one.
   */
  public simulateStatus(next: Partial<INetworkStatus>): void {
    this.status = { ...this.status, ...next };
    for (const cb of this.listeners) cb({ ...this.status });
  }

  /** Convenience — go offline and notify. */
  public goOffline(): void {
    this.simulateStatus({ isOnline: false });
  }

  /** Convenience — go online and notify. */
  public goOnline(type: INetworkStatus["type"] = "wifi"): void {
    this.simulateStatus({ isOnline: true, type });
  }
}
