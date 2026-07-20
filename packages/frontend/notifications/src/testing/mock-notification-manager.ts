/**
 * @file mock-notification-manager.ts
 * @module @stackra/notifications/testing
 * @description In-memory `NotificationManager`-shaped mock.
 *
 *   Implements the full {@link INotificationManager} contract so
 *   tests bind this under `NOTIFICATION_MANAGER` in a test DI
 *   container as a drop-in for the real service.
 */

import type {
  IDeliveryReport,
  INotificationChannelDriver,
  INotificationManager,
  INotificationManagerSnapshot,
  INotificationPayload,
  INotificationPermissionState,
  NotificationManagerListener,
} from '@/core/interfaces';

/**
 * A single recorded dispatch call — used for assertions.
 */
export interface IRecordedNotificationDispatch {
  /** The payload dispatched. */
  readonly payload: INotificationPayload;
  /** Channels the dispatch was routed to. */
  readonly channels: readonly string[];
}

/**
 * In-memory `NotificationManager` mock for testing.
 */
export class MockNotificationManager implements INotificationManager {
  /** Every recorded dispatch, in order. */
  public readonly dispatchCalls: IRecordedNotificationDispatch[] = [];
  /** Registered drivers keyed by id. */
  public readonly drivers = new Map<string, INotificationChannelDriver>();

  /** Number of times `requestPermission` was invoked. */
  public requestPermissionCalls = 0;

  /**
   * Per-channel test hook — when a channel id maps to an entry in
   * this map, the mock uses that error for delivery instead of
   * calling the driver. Handy for simulating a delivery failure
   * without wiring a throwing driver.
   */
  public readonly deliveryErrors = new Map<string, Error>();

  /**
   * When set, `dispatch` returns this canned report list instead of
   * routing through the drivers — useful for tests that want to
   * fake a specific mixed-success outcome.
   */
  public cannedReports: readonly IDeliveryReport[] | null = null;

  private permission: INotificationPermissionState;
  private readonly listeners = new Set<NotificationManagerListener>();
  private snapshot: INotificationManagerSnapshot;

  public constructor(initial?: {
    /** Seed permission state. */
    readonly permission?: INotificationPermissionState;
    /** Seed a driver map. */
    readonly drivers?: readonly INotificationChannelDriver[];
  }) {
    this.permission = initial?.permission ?? {
      supported: true,
      permission: 'default',
    };
    for (const driver of initial?.drivers ?? []) this.drivers.set(driver.id, driver);
    this.snapshot = this.buildSnapshot();
  }

  // ── INotificationManager ─────────────────────────────────────────

  public register(driver: INotificationChannelDriver): void {
    this.drivers.set(driver.id, driver);
    this.emit();
  }

  public async dispatch(
    payload: INotificationPayload,
    options?: { readonly channels?: readonly string[] }
  ): Promise<readonly IDeliveryReport[]> {
    const channels = options?.channels ?? [...this.drivers.keys()];
    this.dispatchCalls.push({ payload, channels });
    if (this.cannedReports) return this.cannedReports;

    const reports: IDeliveryReport[] = [];
    for (const id of channels) {
      const seededError = this.deliveryErrors.get(id);
      if (seededError) {
        reports.push({ channelId: id, deliveredAt: Date.now(), error: seededError });
        continue;
      }
      const driver = this.drivers.get(id);
      if (!driver) {
        reports.push({
          channelId: id,
          deliveredAt: Date.now(),
          error: new Error(`No driver registered for channel "${id}".`),
        });
        continue;
      }
      try {
        await driver.deliver(payload);
        reports.push({ channelId: id, deliveredAt: Date.now(), error: null });
      } catch (raw) {
        const err = raw instanceof Error ? raw : new Error(String(raw));
        reports.push({ channelId: id, deliveredAt: Date.now(), error: err });
      }
    }
    return reports;
  }

  public getSnapshot(): INotificationManagerSnapshot {
    return this.snapshot;
  }

  public getPermissionState(): INotificationPermissionState {
    return this.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    this.requestPermissionCalls += 1;
    return this.permission.permission;
  }

  public subscribe(listener: NotificationManagerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Force the permission state + emit. */
  public simulatePermission(next: NotificationPermission): void {
    this.permission = { ...this.permission, permission: next };
    this.emit();
  }

  /** Force `isSupported` to a specific value. */
  public simulateSupported(next: boolean): void {
    this.permission = { ...this.permission, supported: next };
    this.emit();
  }

  /**
   * Register a delivery error the next time `dispatch` routes to
   * the given channel id — reused across calls until removed.
   */
  public simulateDriverError(channelId: string, error: Error): void {
    this.deliveryErrors.set(channelId, error);
  }

  /** Force the manager to emit a specific report list on next dispatch. */
  public simulateDelivery(reports: readonly IDeliveryReport[]): void {
    this.cannedReports = reports;
  }

  /** Reset all recorded state — keeps registered drivers. */
  public reset(): void {
    this.dispatchCalls.length = 0;
    this.deliveryErrors.clear();
    this.cannedReports = null;
    this.requestPermissionCalls = 0;
  }

  // ── Private ──────────────────────────────────────────────────────

  private buildSnapshot(): INotificationManagerSnapshot {
    return {
      isSupported: this.permission.supported,
      permission: this.permission,
      channels: [...this.drivers.keys()],
    };
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not affect the others.
      }
    }
  }
}
