/**
 * @file analytics-manager.interface.ts
 * @module @stackra/contracts/interfaces/analytics
 * @description Public contract for the analytics manager — the
 *   consent-gated fan-out facade applications inject via `ANALYTICS_MANAGER`.
 */

import type { IAnalyticsPageView, IAnalyticsProvider } from "./analytics-provider.interface";

/**
 * Fan-out facade over every registered {@link IAnalyticsProvider}.
 *
 * Inject via `@Inject(ANALYTICS_MANAGER)`. Dispatch is gated per-provider
 * on the consent category the provider declares; a throwing provider never
 * breaks the others.
 */
export interface IAnalyticsManager {
  /** Track a behavioural event across all consented providers. */
  track(name: string, properties?: Record<string, unknown>): void;

  /** Record a page/screen view across all consented providers. */
  page(view: IAnalyticsPageView): void;

  /** Identify the current user across all consented providers. */
  identify(userId: string, traits?: Record<string, unknown>): void;

  /** Clear identity across every provider. */
  reset(): void;

  /** Register a provider at runtime. */
  register(provider: IAnalyticsProvider): void;

  /** All registered providers. */
  getProviders(): readonly IAnalyticsProvider[];
}
