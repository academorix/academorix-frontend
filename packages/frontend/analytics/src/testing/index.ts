/**
 * @file index.ts
 * @module @stackra/analytics/testing
 * @description Test doubles for the analytics system.
 */

import type { IAnalyticsManager, IAnalyticsPageView, IAnalyticsProvider } from "@stackra/contracts";

/** A recorded analytics call for assertions. */
export type RecordedCall =
  | { kind: "track"; name: string; properties?: Record<string, unknown> }
  | { kind: "page"; view: IAnalyticsPageView }
  | { kind: "identify"; userId: string; traits?: Record<string, unknown> }
  | { kind: "reset" };

/**
 * In-memory analytics manager for tests. Records every call so specs can
 * assert on what would have been dispatched.
 */
export class MockAnalyticsManager implements IAnalyticsManager {
  /** All recorded calls, in order. */
  public readonly calls: RecordedCall[] = [];

  private readonly providers: IAnalyticsProvider[] = [];

  public track(name: string, properties?: Record<string, unknown>): void {
    this.calls.push({ kind: "track", name, properties });
  }

  public page(view: IAnalyticsPageView): void {
    this.calls.push({ kind: "page", view });
  }

  public identify(userId: string, traits?: Record<string, unknown>): void {
    this.calls.push({ kind: "identify", userId, traits });
  }

  public reset(): void {
    this.calls.push({ kind: "reset" });
  }

  public register(provider: IAnalyticsProvider): void {
    this.providers.push(provider);
  }

  public getProviders(): readonly IAnalyticsProvider[] {
    return this.providers;
  }
}

/** Create a fresh {@link MockAnalyticsManager}. */
export function createMockAnalyticsManager(): MockAnalyticsManager {
  return new MockAnalyticsManager();
}
