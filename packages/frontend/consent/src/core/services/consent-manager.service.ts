/**
 * @file consent-manager.service.ts
 * @module @stackra/consent/core/services
 * @description Main consent manager — the reactive store for user consent.
 *
 *   Orchestrates consent state, persistence via a storage adapter, optional
 *   event emission, and a `useSyncExternalStore`-compatible subscription.
 *
 *   Reads the (already-populated) registry, loads persisted preferences, and
 *   applies defaults in `onApplicationBootstrap()` — i.e. AFTER every module
 *   has finished `onModuleInit`, so the `ConsentRegistry` is guaranteed to be
 *   seeded before this manager consumes it.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import type { OnApplicationBootstrap } from '@stackra/contracts';
import { EVENT_EMITTER, type IEventEmitter } from '@stackra/contracts';

import { CONSENT_CONFIG, CONSENT_EVENTS, CONSENT_STORAGE_ADAPTER } from '@stackra/contracts';
import type { IConsentManager, IConsentStorageAdapter } from '@stackra/contracts';
import type { IConsentModuleOptions } from '../types';
import { ConsentRegistry } from './consent-registry.service';

/**
 * Consent manager — the primary service for managing user consent state.
 *
 * Features:
 * - Reactive state with `useSyncExternalStore` support (`getSnapshot` + `subscribe`).
 * - Async storage adapter integration (fire-and-forget persistence).
 * - Optional, fail-open event emission via the shared `EVENT_EMITTER` bus.
 * - Required categories are always granted regardless of user action.
 * - opt-in / opt-out default mode support.
 *
 * @example
 * ```typescript
 * const manager = container.get<IConsentManager>(CONSENT_MANAGER);
 * if (manager.hasConsent('analytics')) loadAnalyticsScript();
 * ```
 */
@Injectable()
export class ConsentManager implements IConsentManager, OnApplicationBootstrap {
  /** Internal preferences state keyed by category slug. */
  private preferences = new Map<string, boolean>();

  /** Whether the user has explicitly made a consent decision. */
  private decided = false;

  /** Reactive subscription listeners. */
  private readonly listeners = new Set<(prefs: Record<string, boolean>) => void>();

  /** Cached snapshot reference for `useSyncExternalStore`. */
  private snapshotRef: Record<string, boolean> = {};

  /**
   * @param registry - Consent category registry for lookups.
   * @param storageAdapter - Optional storage adapter for persistence.
   * @param options - Optional module configuration.
   * @param events - Optional event emitter for lifecycle events.
   */
  public constructor(
    private readonly registry: ConsentRegistry,
    @Optional()
    @Inject(CONSENT_STORAGE_ADAPTER)
    private readonly storageAdapter?: IConsentStorageAdapter,
    @Optional() @Inject(CONSENT_CONFIG) private readonly options?: IConsentModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter
  ) {}

  /**
   * Initialize consent state after all modules have wired their providers.
   *
   * Loads persisted preferences from the storage adapter and applies
   * per-category defaults for anything not already stored. Runs in
   * `onApplicationBootstrap` so the registry is guaranteed populated.
   */
  public async onApplicationBootstrap(): Promise<void> {
    const stored = await this.storageAdapter?.load().catch(() => null);

    if (stored) {
      this.decided = true;
      for (const [key, value] of Object.entries(stored)) {
        this.preferences.set(key, value);
      }
    }

    // Apply defaults for missing categories.
    for (const category of this.registry.getCategories()) {
      if (this.preferences.has(category.slug)) continue;

      if (category.required) {
        this.preferences.set(category.slug, true);
      } else if (!this.decided) {
        const defaultValue = this.options?.defaultMode === 'opt-out' ? true : category.default;
        this.preferences.set(category.slug, defaultValue);
      } else {
        this.preferences.set(category.slug, category.default);
      }
    }

    // Required categories are always granted.
    for (const category of this.registry.getRequired()) {
      this.preferences.set(category.slug, true);
    }

    this.updateSnapshot();
  }

  /**
   * Check if a specific consent category is currently granted.
   *
   * Required categories always return `true`. Non-required categories check
   * the preference map, falling back to the category default.
   *
   * @param category - Category slug to check.
   * @returns True if consent is granted for this category.
   */
  public hasConsent(category: string): boolean {
    const categoryDef = this.registry.getCategory(category);
    if (categoryDef?.required) return true;

    const value = this.preferences.get(category);
    if (value !== undefined) return value;

    return categoryDef?.default ?? false;
  }

  /**
   * Grant consent for a specific category.
   *
   * @param category - Category slug to grant.
   */
  public grantConsent(category: string): void {
    this.preferences.set(category, true);
    this.markDecided();
    this.persist();
    this.notify();
    this.emit(CONSENT_EVENTS.GRANTED, { category, timestamp: Date.now() });
  }

  /**
   * Revoke consent for a specific category. Required categories are a no-op.
   *
   * @param category - Category slug to revoke.
   */
  public revokeConsent(category: string): void {
    const categoryDef = this.registry.getCategory(category);
    if (categoryDef?.required) return;

    this.preferences.set(category, false);
    this.markDecided();
    this.persist();
    this.notify();
    this.emit(CONSENT_EVENTS.REVOKED, { category, timestamp: Date.now() });
  }

  /** Grant all non-required categories at once. */
  public grantAll(): void {
    for (const category of this.registry.getNonRequired()) {
      this.preferences.set(category.slug, true);
    }
    this.markDecided();
    this.persist();
    this.notify();
    this.emit(CONSENT_EVENTS.PREFERENCES_UPDATED, {
      preferences: this.getPreferences(),
      timestamp: Date.now(),
    });
  }

  /** Revoke all non-required categories at once. */
  public revokeAll(): void {
    for (const category of this.registry.getNonRequired()) {
      this.preferences.set(category.slug, false);
    }
    this.markDecided();
    this.persist();
    this.notify();
    this.emit(CONSENT_EVENTS.PREFERENCES_UPDATED, {
      preferences: this.getPreferences(),
      timestamp: Date.now(),
    });
  }

  /**
   * Get the full consent preferences map.
   *
   * @returns Record mapping category slugs to granted (true) / denied (false).
   */
  public getPreferences(): Record<string, boolean> {
    return this.snapshotRef;
  }

  /**
   * Bulk-set consent preferences. Required categories are forced to `true`.
   *
   * @param prefs - Map of category slugs to consent state.
   */
  public setPreferences(prefs: Record<string, boolean>): void {
    for (const [key, value] of Object.entries(prefs)) {
      const categoryDef = this.registry.getCategory(key);
      this.preferences.set(key, categoryDef?.required ? true : value);
    }
    this.markDecided();
    this.persist();
    this.notify();
    this.emit(CONSENT_EVENTS.PREFERENCES_UPDATED, {
      preferences: this.getPreferences(),
      timestamp: Date.now(),
    });
  }

  /**
   * Whether the user has made an explicit consent decision.
   *
   * @returns False until the user interacts with the consent UI.
   */
  public isDecided(): boolean {
    return this.decided;
  }

  /**
   * Subscribe to consent state changes.
   *
   * @param listener - Callback invoked with the preference map on every change.
   * @returns Unsubscribe function.
   */
  public subscribe(listener: (prefs: Record<string, boolean>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get the current snapshot for `useSyncExternalStore`.
   *
   * Returns a stable reference that only changes when preferences change.
   *
   * @returns The current preferences object reference.
   */
  public getSnapshot(): Record<string, boolean> {
    return this.snapshotRef;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Private helpers
  // ══════════════════════════════════════════════════════════════════════════

  /** Mark that the user has explicitly decided; emit DECIDED on first decision. */
  private markDecided(): void {
    if (this.decided) return;
    this.decided = true;
    this.emit(CONSENT_EVENTS.DECIDED, {
      preferences: this.getPreferences(),
      timestamp: Date.now(),
    });
  }

  /** Persist preferences via the storage adapter (fire-and-forget). */
  private persist(): void {
    this.updateSnapshot();
    this.storageAdapter?.save(this.snapshotRef).catch(() => {
      // Fail-open — persistence errors must never break consent operations.
    });
  }

  /** Notify all subscribed listeners of a state change. */
  private notify(): void {
    const snapshot = this.snapshotRef;
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // A subscriber error must not break the store.
      }
    }
  }

  /** Rebuild the cached snapshot reference from the preference map. */
  private updateSnapshot(): void {
    const obj: Record<string, boolean> = {};
    for (const [key, value] of this.preferences) {
      obj[key] = value;
    }
    this.snapshotRef = obj;
  }

  /**
   * Emit a consent lifecycle event on the optional event bus, fail-open.
   *
   * @param event - Event name.
   * @param data - Event payload.
   */
  private emit(event: string, data: unknown): void {
    if (!this.events) return;
    if (this.options?.emitEvents === false) return;

    try {
      void this.events.emit(event, {
        event,
        data,
        metadata: { source: '@stackra/consent', timestamp: new Date() },
      });
    } catch {
      // Fail-open — event emission must never break consent operations.
    }
  }
}
