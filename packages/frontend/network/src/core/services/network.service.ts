/**
 * @file network.service.ts
 * @module @stackra/network/core/services
 * @description NetworkService — wraps an INetworkDetector and emits events on status change.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import { EVENT_EMITTER, NETWORK_DETECTOR, NETWORK_EVENTS } from "@stackra/contracts";
import type { IEventEmitter, INetworkDetector, INetworkStatus } from "@stackra/contracts";

/**
 * NetworkService — high-level network monitoring with event emission.
 *
 * Wraps a platform-specific {@link INetworkDetector} and emits
 * `NETWORK_EVENTS.STATUS_CHANGED` on the optional `EVENT_EMITTER` bus
 * whenever connectivity changes.
 *
 * @example
 * ```typescript
 * import { useInject } from '@stackra/container/react';
 * import { NETWORK_SERVICE } from '@stackra/network';
 *
 * const network = useInject<NetworkService>(NETWORK_SERVICE);
 * const isOnline = network.isOnline();
 * const status = await network.getStatus();
 * ```
 */
@Injectable()
export class NetworkService {
  /** Scoped logger for fail-soft emit warnings. */
  private readonly logger = new Logger(NetworkService.name);

  /** Detector unsubscribe handle. */
  private unsubscribe?: () => void;

  /**
   * @param detector - Platform-specific network detector
   * @param eventEmitter - Optional event emitter for lifecycle events
   */
  public constructor(
    @Inject(NETWORK_DETECTOR)
    private readonly detector: INetworkDetector,
    @Optional()
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter?: IEventEmitter,
  ) {
    this.startListening();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Check if the device is currently online.
   *
   * @returns `true` if the device has network connectivity
   */
  public isOnline(): boolean {
    return this.detector.isOnline();
  }

  /**
   * Get the full network status including connection type and speed.
   *
   * @returns A promise resolving to the current network status
   */
  public async getStatus(): Promise<INetworkStatus> {
    return this.detector.getStatus();
  }

  /**
   * Subscribe to network status changes.
   *
   * @param cb - Callback invoked on each status change
   * @returns An unsubscribe function
   */
  public subscribe(cb: (status: INetworkStatus) => void): () => void {
    return this.detector.subscribe(cb);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Clean up subscriptions and resources.
   */
  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Start listening to the detector and emit events on changes.
   */
  private startListening(): void {
    this.unsubscribe = this.detector.subscribe((status) => {
      this.emitStatusChanged(status);
    });
  }

  /**
   * Emit a network status changed event on the optional event bus.
   *
   * Fail-soft: silently no-ops when no emitter is registered and swallows
   * errors thrown by listeners so a misbehaving subscriber can never break
   * the detector's change loop.
   *
   * @param status - The new network status
   */
  private emitStatusChanged(status: INetworkStatus): void {
    if (!this.eventEmitter) return;
    try {
      void this.eventEmitter.emit(NETWORK_EVENTS.STATUS_CHANGED, { status });
    } catch (error: unknown) {
      this.logger.warn("[NetworkService] failed to emit network status changed event", { error });
    }
  }
}
