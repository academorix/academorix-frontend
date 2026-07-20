/**
 * @file mock-consent-manager.ts
 * @module @stackra/consent/testing
 * @description In-memory `IConsentManager` implementation for tests.
 *
 *   Holds preferences in a plain `Map`, notifies subscribers on every
 *   mutation, and exposes helpers (`simulateDecided`, `reset`) so tests
 *   can drive consent state deterministically — no storage adapter, no
 *   event bus, no DI wiring required.
 */

import type { IConsentManager } from "@stackra/contracts";

/**
 * In-memory consent manager for testing.
 *
 * Mirrors the full `IConsentManager` contract (`hasConsent`,
 * `grantConsent`, `revokeConsent`, `grantAll`, `revokeAll`,
 * `getPreferences`, `setPreferences`, `isDecided`, `subscribe`,
 * `getSnapshot`) so it can be registered under `CONSENT_MANAGER` in
 * tests as a drop-in replacement for the real `ConsentManager`.
 *
 * Required categories are honoured — pass them in `initial.required`
 * and any grant/revoke on those names is a no-op that still returns
 * `true` from `hasConsent`.
 */
export class MockConsentManager implements IConsentManager {
  /** Internal preference state keyed by category slug. */
  private preferences: Record<string, boolean> = {};

  /** Category slugs that are always granted (cannot be revoked). */
  private readonly required = new Set<string>();

  /** Whether an explicit decision has been recorded. */
  private decided = false;

  /** Registered snapshot listeners. */
  private readonly listeners = new Set<(prefs: Record<string, boolean>) => void>();

  /** Cached snapshot reference — stable between mutations. */
  private snapshotRef: Record<string, boolean> = {};

  public constructor(initial?: {
    /** Seed preferences for the mock. */
    preferences?: Record<string, boolean>;
    /** Category slugs to treat as required (always granted). */
    required?: readonly string[];
    /** Seed `isDecided()` state. */
    decided?: boolean;
  }) {
    for (const slug of initial?.required ?? []) this.required.add(slug);
    this.preferences = { ...(initial?.preferences ?? {}) };
    // Required categories are always granted.
    for (const slug of this.required) this.preferences[slug] = true;
    this.decided = initial?.decided ?? false;
    this.snapshotRef = { ...this.preferences };
  }

  public hasConsent(category: string): boolean {
    if (this.required.has(category)) return true;
    return this.preferences[category] === true;
  }

  public grantConsent(category: string): void {
    this.preferences[category] = true;
    this.markDecided();
    this.updateSnapshot();
    this.notify();
  }

  public revokeConsent(category: string): void {
    if (this.required.has(category)) return;
    this.preferences[category] = false;
    this.markDecided();
    this.updateSnapshot();
    this.notify();
  }

  public grantAll(): void {
    for (const key of Object.keys(this.preferences)) {
      if (!this.required.has(key)) this.preferences[key] = true;
    }
    this.markDecided();
    this.updateSnapshot();
    this.notify();
  }

  public revokeAll(): void {
    for (const key of Object.keys(this.preferences)) {
      if (!this.required.has(key)) this.preferences[key] = false;
    }
    this.markDecided();
    this.updateSnapshot();
    this.notify();
  }

  public getPreferences(): Record<string, boolean> {
    return this.snapshotRef;
  }

  public setPreferences(prefs: Record<string, boolean>): void {
    for (const [key, value] of Object.entries(prefs)) {
      this.preferences[key] = this.required.has(key) ? true : value;
    }
    this.markDecided();
    this.updateSnapshot();
    this.notify();
  }

  public isDecided(): boolean {
    return this.decided;
  }

  public subscribe(listener: (prefs: Record<string, boolean>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): Record<string, boolean> {
    return this.snapshotRef;
  }

  // ── Test hooks ────────────────────────────────────────────────────────

  /** Force `isDecided()` to return the given value without dispatching. */
  public simulateDecided(next: boolean): void {
    this.decided = next;
  }

  /** Reset the mock to its post-construction state — no listeners fired. */
  public reset(): void {
    this.preferences = {};
    for (const slug of this.required) this.preferences[slug] = true;
    this.decided = false;
    this.snapshotRef = { ...this.preferences };
  }

  private markDecided(): void {
    this.decided = true;
  }

  private updateSnapshot(): void {
    this.snapshotRef = { ...this.preferences };
  }

  private notify(): void {
    const snapshot = this.snapshotRef;
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // A subscriber error must not break the mock.
      }
    }
  }
}
