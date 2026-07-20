/**
 * @file mock-in-app-notification-centre.ts
 * @module @stackra/notifications/testing
 * @description In-memory `InAppNotificationCentre`-shaped mock.
 *
 *   Mirrors the public surface of the real service so tests bind
 *   this under `IN_APP_NOTIFICATION_CENTRE` in a test DI container.
 *   The mock never persists — every mutation stays local — but
 *   it does maintain the same referentially-stable snapshot contract
 *   so React consumers reading through `useSyncExternalStore` behave
 *   identically to production.
 */

import { Str } from '@stackra/support';

import type {
  IInAppNotification,
  IInAppNotificationCentreSnapshot,
  INotificationPayload,
} from '@/core/interfaces';
import type { InAppNotificationCentreListener } from '@/core/services';

/**
 * In-memory in-app notification centre for testing.
 */
export class MockInAppNotificationCentre {
  private items: IInAppNotification[] = [];
  private readonly listeners = new Set<InAppNotificationCentreListener>();
  private snapshot: IInAppNotificationCentreSnapshot;

  public constructor(initial?: {
    /** Seed the centre with pre-existing items. */
    readonly items?: readonly IInAppNotification[];
  }) {
    this.items = initial?.items ? [...initial.items] : [];
    this.snapshot = this.buildSnapshot();
  }

  // ── Reads ────────────────────────────────────────────────────────

  public getSnapshot(): IInAppNotificationCentreSnapshot {
    return this.snapshot;
  }

  // ── Mutations ────────────────────────────────────────────────────

  public async dispatch(payload: INotificationPayload): Promise<IInAppNotification> {
    const entry: IInAppNotification = {
      id: Str.random(16),
      createdAt: payload.timestamp ?? Date.now(),
      seenAt: null,
      dismissedAt: null,
      payload,
    };
    this.items = [entry, ...this.items];
    this.emit();
    return entry;
  }

  public async markSeen(id: string): Promise<boolean> {
    const existing = this.items.find((e) => e.id === id);
    if (!existing || existing.seenAt != null) return false;
    this.items = this.items.map((e) => (e.id === id ? { ...e, seenAt: Date.now() } : e));
    this.emit();
    return true;
  }

  public async dismiss(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((e) => e.id !== id);
    if (this.items.length === before) return false;
    this.emit();
    return true;
  }

  public async clear(): Promise<void> {
    if (this.items.length === 0) return;
    this.items = [];
    this.emit();
  }

  // ── Subscription ─────────────────────────────────────────────────

  public subscribe(listener: InAppNotificationCentreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Test hooks ───────────────────────────────────────────────────

  /** Force the item list directly + emit. */
  public simulateItems(items: readonly IInAppNotification[]): void {
    this.items = [...items];
    this.emit();
  }

  /** Reset state without touching subscribers. */
  public reset(): void {
    this.items = [];
    this.emit();
  }

  // ── Private ──────────────────────────────────────────────────────

  private buildSnapshot(): IInAppNotificationCentreSnapshot {
    return {
      items: this.items,
      unreadCount: this.items.reduce((n, e) => (e.seenAt == null ? n + 1 : n), 0),
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
