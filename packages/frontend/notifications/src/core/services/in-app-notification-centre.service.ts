/**
 * @file in-app-notification-centre.service.ts
 * @module @stackra/notifications/core/services
 * @description Durable queue of received in-app notifications.
 *
 *   Backed by `@stackra/storage`'s `IStorageManager` — when a
 *   storage manager is registered, every mutation is persisted; when
 *   it isn't, the centre runs in memory-only mode. Snapshot swaps
 *   on every mutation so React consumers reading through
 *   `useSyncExternalStore` never tear.
 *
 *   The centre lives at the intersection of "durable queue of
 *   received notifications" and "in-app notification bell". It
 *   never itself calls `Notification.new(...)` — a channel driver
 *   or the caller does that. The centre records, orders, and
 *   surfaces what the app has already been told to display.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import type { OnModuleInit } from '@stackra/contracts';
import { STORAGE_MANAGER, type IStorage, type IStorageManager } from '@stackra/contracts';
import { Str } from '@stackra/support';

import { NOTIFICATION_CONFIG, NOTIFICATION_EVENTS } from '../constants';
import { normalizeNotificationPayload } from '../utils';
import type {
  IInAppNotification,
  IInAppNotificationCentreSnapshot,
  INotificationModuleOptions,
  INotificationPayload,
} from '../interfaces';
import { AnalyticsBridgeService } from './analytics-bridge.service';

/** Listener signature — receives no argument. */
export type InAppNotificationCentreListener = () => void;

/**
 * The in-app notification centre.
 *
 * @example
 * ```typescript
 * const centre = app.get(IN_APP_NOTIFICATION_CENTRE);
 * const off = centre.subscribe(() => render());
 * centre.dispatch({ title: 'New comment', body: 'Hi!' });
 * const { items, unreadCount } = centre.getSnapshot();
 * ```
 */
@Injectable()
export class InAppNotificationCentre implements OnModuleInit {
  /** Storage key holding the serialised queue. */
  private readonly storageKey: string;

  /** Storage instance name — falls back to the manager's default. */
  private readonly instanceName: string | undefined;

  /** Hard ceiling on queue depth. */
  private readonly maxItems: number;

  /** In-memory copy of the queue. */
  private items: IInAppNotification[] = [];

  /** Whether `hydrate()` has already run. */
  private hydrated = false;

  /** Cached `IStorage` — resolved on first hit. */
  private storageCached: IStorage | null = null;

  /** Registered snapshot listeners. */
  private readonly listeners = new Set<InAppNotificationCentreListener>();

  /** Cached snapshot swapped on every mutation. */
  private snapshot: IInAppNotificationCentreSnapshot;

  public constructor(
    @Inject(NOTIFICATION_CONFIG) config: INotificationModuleOptions,
    @Optional()
    @Inject(STORAGE_MANAGER)
    private readonly manager?: IStorageManager,
    // AnalyticsBridgeService is a peer within the same package — the
    // container resolves it optionally so tests that instantiate the
    // centre directly can skip wiring it.
    @Optional() private readonly analytics?: AnalyticsBridgeService
  ) {
    const centre = config.centre ?? {};
    this.instanceName = centre.storage;
    this.storageKey = centre.storageKey ?? 'stackra:notifications:centre';
    this.maxItems = centre.maxItems ?? 100;
    this.snapshot = this.buildSnapshot();
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  /**
   * Hydrate from storage on module init. Fail-soft on every
   * possible IO failure so a corrupt serialisation cannot brick the
   * app.
   */
  public async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  // ── Reads ────────────────────────────────────────────────────────

  /**
   * Referentially stable snapshot for `useSyncExternalStore`.
   *
   * The centre returns the same object identity across calls until
   * a mutation swaps it — matches the contract concurrent React
   * expects.
   */
  public getSnapshot(): IInAppNotificationCentreSnapshot {
    return this.snapshot;
  }

  // ── Mutations ────────────────────────────────────────────────────

  /**
   * Enqueue a new in-app notification.
   *
   * @param payload - The notification body.
   * @returns The persisted entry with a stable id + timestamps.
   */
  public async dispatch(payload: INotificationPayload): Promise<IInAppNotification> {
    await this.hydrate();

    const normalised = normalizeNotificationPayload(payload);
    const entry: IInAppNotification = {
      id: this.generateId(),
      createdAt: normalised.timestamp ?? Date.now(),
      seenAt: null,
      dismissedAt: null,
      payload: normalised,
    };

    // Push then trim to `maxItems`. Oldest-first eviction keeps the
    // centre's memory bounded — a runaway push storm can't leak.
    this.items = [entry, ...this.items].slice(0, this.maxItems);
    await this.persist();
    this.emit();
    // Fire the analytics event with a minimal payload — id + title
    // are enough for the funnel; the full payload can be looked up
    // in the caller's own store.
    this.analytics?.emit(NOTIFICATION_EVENTS.IN_APP_DISPATCHED, {
      id: entry.id,
      title: entry.payload.title,
    });
    return entry;
  }

  /**
   * Mark a single entry as seen — decrements the `unreadCount`.
   *
   * @param id - The entry id.
   * @returns `true` when the entry existed and wasn't already seen.
   */
  public async markSeen(id: string): Promise<boolean> {
    await this.hydrate();
    const idx = this.items.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    const existing = this.items[idx];
    if (!existing || existing.seenAt != null) return false;
    this.items = this.items.map((e) => (e.id === id ? { ...e, seenAt: Date.now() } : e));
    await this.persist();
    this.emit();
    this.analytics?.emit(NOTIFICATION_EVENTS.IN_APP_SEEN, { id });
    return true;
  }

  /**
   * Dismiss a single entry — removes it from the visible queue.
   *
   * @param id - The entry id.
   * @returns `true` when the entry existed.
   */
  public async dismiss(id: string): Promise<boolean> {
    await this.hydrate();
    const before = this.items.length;
    this.items = this.items.filter((e) => e.id !== id);
    if (this.items.length === before) return false;
    await this.persist();
    this.emit();
    this.analytics?.emit(NOTIFICATION_EVENTS.IN_APP_DISMISSED, { id });
    return true;
  }

  /** Drop every entry. */
  public async clear(): Promise<void> {
    await this.hydrate();
    if (this.items.length === 0) return;
    this.items = [];
    await this.persist();
    this.emit();
    this.analytics?.emit(NOTIFICATION_EVENTS.IN_APP_CLEARED);
  }

  // ── Subscription ────────────────────────────────────────────────

  /** Subscribe to snapshot changes; returns an unsubscribe function. */
  public subscribe(listener: InAppNotificationCentreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Private ─────────────────────────────────────────────────────

  /** Resolve the underlying storage instance lazily. */
  private storage(): IStorage | null {
    if (!this.manager) return null;
    if (this.storageCached) return this.storageCached;
    this.storageCached = this.instanceName
      ? this.manager.instance(this.instanceName)
      : this.manager.instance();
    return this.storageCached;
  }

  /** Load persisted entries into memory on first access. */
  private async hydrate(): Promise<void> {
    if (this.hydrated) return;
    const storage = this.storage();
    if (!storage) {
      this.hydrated = true;
      return;
    }
    try {
      const raw = await storage.get<IInAppNotification[]>(this.storageKey);
      if (Array.isArray(raw)) {
        this.items = raw;
      }
    } catch {
      // fail-soft — a corrupt payload must not brick the app.
      this.items = [];
    }
    this.hydrated = true;
    // Rebuild the snapshot after hydration so the first
    // `getSnapshot()` reflects the persisted state, not the empty
    // initial snapshot.
    this.snapshot = this.buildSnapshot();
  }

  /** Persist the current queue to storage. */
  private async persist(): Promise<void> {
    const storage = this.storage();
    if (!storage) return;
    try {
      await storage.set(this.storageKey, this.items);
    } catch {
      // fail-soft — private mode / quota exceeded / etc.
    }
  }

  /** Rebuild the immutable snapshot from current state. */
  private buildSnapshot(): IInAppNotificationCentreSnapshot {
    return {
      items: this.items,
      unreadCount: this.items.reduce((n, e) => (e.seenAt == null ? n + 1 : n), 0),
    };
  }

  /** Swap the cached snapshot and fan out to every subscriber. */
  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken subscriber must not prevent the others.
      }
    }
  }

  /** Generate a compact random id via `Str.random`. */
  private generateId(): string {
    // Str.random keeps us aligned with the workspace's support-utilities
    // steering — no bespoke random helpers.
    return Str.random(16);
  }
}
