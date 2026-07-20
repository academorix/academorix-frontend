/**
 * @file mock-analytics-client.ts
 * @module @stackra/pwa/testing
 * @description In-memory `IAnalyticsManager` stand-in that records
 *   every dispatched event for later assertions.
 *
 *   `AnalyticsBridgeService` now binds directly against
 *   `ANALYTICS_MANAGER` (from `@stackra/contracts`) — this mock
 *   implements that contract so `new AnalyticsBridgeService(mock)`
 *   works as a drop-in for tests that don't want to spin up a real
 *   `@stackra/analytics` manager.
 */

import type {
  IAnalyticsIdentity,
  IAnalyticsManager,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from "@stackra/contracts";

/**
 * A single recorded analytics event.
 */
export interface IRecordedAnalyticsCall {
  /** Event name passed to `track`. */
  readonly event: string;
  /** Optional payload passed to `track`. */
  readonly payload: Record<string, unknown> | undefined;
}

/**
 * In-memory `IAnalyticsManager` stand-in for tests.
 *
 * Every `track` invocation is recorded on `.calls`. The mock also
 * implements the `page` / `identify` / `reset` / `register` /
 * `getProviders` surface so it satisfies the full `IAnalyticsManager`
 * contract — but only `track` is exercised by
 * `AnalyticsBridgeService`.
 *
 * @example
 * ```ts
 * const analytics = new MockAnalyticsClient();
 * // Register under ANALYTICS_MANAGER in a test DI container, OR
 * // hand it directly to AnalyticsBridgeService:
 * const bridge = new AnalyticsBridgeService(analytics);
 * bridge.emit(PWA_EVENTS.INSTALL_DISMISSED, { count: 1 });
 * expect(analytics.calls).toEqual([
 *   { event: 'pwa.install.dismissed', payload: { count: 1 } },
 * ]);
 * ```
 */
export class MockAnalyticsClient implements IAnalyticsManager {
  /** Every recorded call in order. */
  public readonly calls: IRecordedAnalyticsCall[] = [];

  /** Recorded `page` calls (rare — kept for parity). */
  public readonly pageCalls: IAnalyticsPageView[] = [];

  /** Recorded `identify` calls. */
  public readonly identifyCalls: IAnalyticsIdentity[] = [];

  /** `reset` invocation count. */
  public resetCalls = 0;

  /**
   * When set, `track` throws with this error — used to test the
   * bridge's fail-soft behaviour.
   */
  public throwOnTrack: Error | null = null;

  /** Ad-hoc registered providers — mirrors `IAnalyticsManager`. */
  private readonly providers: IAnalyticsProvider[] = [];

  /** Record + optionally throw. */
  public track(event: string, payload?: Record<string, unknown>): void {
    this.calls.push({ event, payload });
    if (this.throwOnTrack) throw this.throwOnTrack;
  }

  /** Record the page view — no-op otherwise. */
  public page(view: IAnalyticsPageView): void {
    this.pageCalls.push(view);
  }

  /** Record the identify call — no-op otherwise. */
  public identify(userId: string, traits?: Record<string, unknown>): void {
    this.identifyCalls.push({ userId, traits });
  }

  /** Count the reset call. */
  public reset(): void {
    this.resetCalls += 1;
  }

  /** Register a provider — kept for full-contract completeness. */
  public register(provider: IAnalyticsProvider): void {
    this.providers.push(provider);
  }

  /** All ad-hoc registered providers. */
  public getProviders(): readonly IAnalyticsProvider[] {
    return this.providers;
  }

  /** Reset the recorded call log without touching `throwOnTrack`. */
  public resetLog(): void {
    this.calls.length = 0;
    this.pageCalls.length = 0;
    this.identifyCalls.length = 0;
    this.resetCalls = 0;
  }
}
