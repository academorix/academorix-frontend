/**
 * @file consent-gate.ts
 * @module @stackra/analytics/__tests__/support
 * @description Controllable `IConsentGate` for tests.
 *
 *   Category grants are stored in an in-memory map; test code toggles
 *   them with `.grant(category)` / `.revoke(category)` and — when a
 *   subscriber is attached — every change notifies the listener so
 *   the manager's buffer-and-flush code path is exercised end-to-end.
 */

import type { IConsentGate } from "@/core/interfaces";

/** Controllable consent gate that emits change notifications. */
export class ControllableConsentGate implements IConsentGate {
  private readonly grants: Record<string, boolean> = {};

  private readonly listeners: Array<(prefs: Record<string, boolean>) => void> = [];

  public constructor(initial: Record<string, boolean> = {}) {
    Object.assign(this.grants, initial);
  }

  public hasConsent(category: string): boolean {
    return this.grants[category] === true;
  }

  public subscribe(listener: (prefs: Record<string, boolean>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  /** Grant consent for a category and notify subscribers. */
  public grant(category: string): void {
    this.grants[category] = true;
    this.notify();
  }

  /** Revoke consent for a category and notify subscribers. */
  public revoke(category: string): void {
    this.grants[category] = false;
    this.notify();
  }

  private notify(): void {
    // Snapshot the map so listeners can't mutate our copy.
    const snapshot = { ...this.grants };
    for (const listener of this.listeners) listener(snapshot);
  }
}
