/**
 * @file tour-analytics.ts
 * @module onboarding/tour/tour-analytics
 *
 * @description
 * Thin abstraction for the analytics events the tour + checklist emit.
 * Every event id comes from {@link "@/config/analytics.config".EVENTS};
 * we never inline a string at the call site because a typo only shows
 * up weeks later as a missing tile in the analytics dashboard.
 *
 * ## Why a helper, not a direct provider call?
 *
 * The Phase 0 analytics wiring is separate — the dashboard hasn't yet
 * mounted `<AnalyticsProvider>` (see `main.tsx` TODO). Rather than
 * gate every call site on the provider being mounted, we centralise
 * the emit path here so:
 *
 * 1. Every event lands in dev-mode console logs (helpful during
 *    onboarding QA — you can see the funnel unfold live).
 * 2. When the provider lands, we flip ONE branch here and every
 *    onboarding surface starts feeding it.
 *
 * TODO(sub-agent-integration): wire this to the `AnalyticsProvider`
 * once `main.tsx` mounts one — see `main.tsx` `reportWebVitals`
 * comment for the same pattern.
 */

import type { AnalyticsEventKey } from "@/config/analytics.config";

import { EVENTS } from "@/config/analytics.config";

/**
 * Bag of scalar properties attached to an emitted event. Kept loose
 * because different events carry different shapes (a step-advance
 * event carries `from_step`/`to_step`; a checklist event carries
 * `task_id`).
 */
export type OnboardingEventProps = Record<string, string | number | boolean | null>;

/**
 * Emit an onboarding-namespace analytics event. The `event` argument
 * is one of the `EVENTS.*` keys — the string value is looked up here
 * so a typo becomes a TypeScript error.
 *
 * @param event - Registry key (e.g. `"onboardingTourStarted"`).
 * @param props - Optional scalar payload merged into the event.
 */
export function emitOnboardingEvent(
  event: AnalyticsEventKey,
  props: OnboardingEventProps = {},
): void {
  const name = EVENTS[event];

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[onboarding.analytics] ${name}`, props);
  }

  // TODO(sub-agent-integration): forward to the AnalyticsProvider
  // once it's mounted in `providers.tsx`. Until then this helper is
  // dev-only observability.
}
