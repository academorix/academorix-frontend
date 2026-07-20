/**
 * @file network-detector.service.ts
 * @module @stackra/sync/core/services
 * @description NetworkDetector — monitors online/offline connectivity and
 *   optionally probes a caller-supplied URL to catch "connected but
 *   internet-less" states. Emits {@link NETWORK_STATUS_CHANGED} on the
 *   shared event bus every time the debounced status flips.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { BehaviorSubject, fromEvent, merge, type Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, map, startWith } from "rxjs/operators";
import type {
  IConnectivityCheck,
  IEventEmitter,
  INetworkDetectorConfig,
  INetworkStatus,
} from "@stackra/contracts";
import { EVENT_EMITTER, NETWORK_DETECTOR_CONFIG, NETWORK_STATUS_CHANGED } from "@stackra/contracts";
import { Logger } from "@stackra/logger";

/**
 * NetworkDetector — monitors connectivity with debouncing and an optional
 * caller-supplied probe.
 */
@Injectable()
export class NetworkDetector {
  private readonly logger = new Logger(NetworkDetector.name);
  private readonly statusSubject: BehaviorSubject<INetworkStatus>;
  private readonly config: {
    customCheck: IConnectivityCheck;
    debounceTime: number;
    enableCustomChecks: boolean;
    customCheckInterval: number;
  };
  private customCheckInterval?: ReturnType<typeof setInterval>;
  private previousStatus?: INetworkStatus;

  /** Observable that emits (debounced) network status changes. */
  public readonly status$: Observable<INetworkStatus>;

  public constructor(
    @Optional() @Inject(NETWORK_DETECTOR_CONFIG) config: INetworkDetectorConfig = {},
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter,
  ) {
    this.config = {
      customCheck:
        config.customCheck ??
        (() => Promise.resolve(typeof navigator === "undefined" ? true : navigator.onLine)),
      debounceTime: config.debounceTime ?? 1000,
      enableCustomChecks: config.enableCustomChecks ?? false,
      customCheckInterval: config.customCheckInterval ?? 30_000,
    };

    this.statusSubject = new BehaviorSubject<INetworkStatus>({
      isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
    });

    this.status$ = this.statusSubject.asObservable().pipe(
      debounceTime(this.config.debounceTime),
      distinctUntilChanged((prev, curr) => prev.isOnline === curr.isOnline),
    );

    this.startMonitoring();
  }

  /** Whether the device currently has connectivity. */
  public isOnline(): boolean {
    return this.statusSubject.value.isOnline;
  }

  /** Current network status snapshot. */
  public getStatus(): INetworkStatus {
    return { ...this.statusSubject.value };
  }

  /** Trigger a manual connectivity probe. */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const online = await this.config.customCheck();
      this.updateStatus(online);
      return online;
    } catch {
      this.updateStatus(false);
      return false;
    }
  }

  private startMonitoring(): void {
    if (typeof window !== "undefined") {
      const online$ = fromEvent(window, "online").pipe(map(() => true));
      const offline$ = fromEvent(window, "offline").pipe(map(() => false));

      merge(online$, offline$)
        .pipe(startWith(navigator.onLine))
        .subscribe((online) => this.updateStatus(online));
    }

    if (this.config.enableCustomChecks) {
      this.customCheckInterval = setInterval(
        () => void this.checkConnectivity(),
        this.config.customCheckInterval,
      );
    }
  }

  private updateStatus(online: boolean): void {
    const current = this.statusSubject.value;
    if (current.isOnline === online) return;

    this.previousStatus = { ...current };
    const nextStatus: INetworkStatus = { isOnline: online };
    this.statusSubject.next(nextStatus);
    this.dispatchStatusChangedEvent(nextStatus, this.previousStatus);
  }

  private dispatchStatusChangedEvent(
    status: INetworkStatus,
    previousStatus?: INetworkStatus,
  ): void {
    if (!this.events) return;
    try {
      void this.events.emit(NETWORK_STATUS_CHANGED, { status, previousStatus });
    } catch (error: unknown) {
      this.logger.warn("[NetworkDetector] Failed to emit status change", { error });
    }
  }

  /** Cleanup resources. */
  public destroy(): void {
    if (this.customCheckInterval) {
      clearInterval(this.customCheckInterval);
      this.customCheckInterval = undefined;
    }
    this.statusSubject.complete();
  }
}
