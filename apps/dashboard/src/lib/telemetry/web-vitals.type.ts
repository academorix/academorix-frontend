/**
 * @file web-vitals.type.ts
 * @module lib/telemetry/web-vitals.type
 *
 * @description
 * Shared type aliases for the Core Web Vitals reporting pipeline. Kept in a
 * dedicated file (rather than co-located with the util) so tests, adapters,
 * and future storybook-style docs can pull the types without importing the
 * observer registration side-effect surface.
 *
 * ## What lives here
 *
 *   - {@link WebVitalName}      — union of every metric the observer emits.
 *   - {@link WebVitalRating}    — Google's three-bucket verdict per metric.
 *   - {@link WebVitalNavType}   — `PerformanceNavigationTiming.type` extended
 *                                 with the extra bfcache/prerender/restore
 *                                 states the `web-vitals` library adds.
 *   - {@link WebVitalReport}    — the structured payload the reporter hands
 *                                 off to consumers (analytics adapters, logs).
 *   - {@link ReportWebVitalsFn} — the callback signature `reportWebVitals`
 *                                 takes; every consumer implements this
 *                                 (thin bridge into analytics.track / console
 *                                 in dev / no-op / etc).
 *
 * ## Notes on `web-vitals` v5
 *
 * `web-vitals@5` retired `onFID` in favour of `onINP` (INP replaced FID as a
 * Core Web Vital in March 2024). This module surfaces INP, CLS, LCP, TTFB, and
 * FCP — the five metrics the library still ships — and keeps `FID` off the
 * union so consumers do not accidentally branch on a metric they will never
 * receive.
 *
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/web-vitals
 *
 * @related web-vitals.util.ts — the observer registration entrypoint.
 * @related index.ts           — barrel re-exporting the public surface.
 */

// ---------------------------------------------------------------------------
// Public unions
// ---------------------------------------------------------------------------

/**
 * The metric names emitted by our observer. Matches the `Metric["name"]` union
 * from `web-vitals@5` verbatim so a consumer switch is exhaustive.
 *
 * - **CLS**  Cumulative Layout Shift  (unitless score, 0 = perfect)
 * - **LCP**  Largest Contentful Paint (milliseconds)
 * - **INP**  Interaction to Next Paint (milliseconds — replaces FID in v5)
 * - **TTFB** Time to First Byte      (milliseconds)
 * - **FCP**  First Contentful Paint  (milliseconds)
 */
export type WebVitalName = "CLS" | "LCP" | "INP" | "TTFB" | "FCP";

/**
 * Google's three-bucket verdict per metric — the raw value is bucketed against
 * published thresholds (see `CLSThresholds`, `LCPThresholds`, etc.).
 *
 * - **good**              value ≤ lower threshold
 * - **needs-improvement** lower threshold < value ≤ upper threshold
 * - **poor**              value > upper threshold
 */
export type WebVitalRating = "good" | "needs-improvement" | "poor";

/**
 * The navigation type recorded on the metric. Mirrors the `Metric.navigationType`
 * from `web-vitals@5`, which extends `PerformanceNavigationTiming.type` with
 * bfcache + prerender + restore states.
 */
export type WebVitalNavType =
  "navigate" | "reload" | "back-forward" | "back-forward-cache" | "prerender" | "restore";

// ---------------------------------------------------------------------------
// Report payload
// ---------------------------------------------------------------------------

/**
 * The structured payload the reporter hands off to consumers. A projection of
 * the `web-vitals` Metric type that keeps only the fields analytics adapters
 * actually need (dropping `entries` — a raw PerformanceEntry array that would
 * balloon PostHog / Sentry payloads and blow past their 4 KB event limits).
 *
 * ## Field notes
 *
 *  - `path` — captured at report time from `window.location.pathname`. The
 *    observer stays alive for the SPA lifetime, so this is the pathname at
 *    the moment the metric fired, not the pathname where the page loaded.
 *    For SPAs this matters for CLS / INP metrics that fire long after the
 *    initial navigation.
 *  - `delta` — kept alongside `value` so an analytics backend that wants to
 *    aggregate over time (sum-of-deltas === current value) has the raw
 *    signal. Callers that just want the current value pull `value`.
 *  - `id` — unique per metric instance; use it to dedupe multiple values
 *    reported for the same metric during a session (INP fires repeatedly as
 *    the user interacts).
 */
export interface WebVitalReport {
  /** Metric acronym. */
  readonly metric: WebVitalName;
  /** Current metric value (unit varies — ms for LCP/FCP/TTFB/INP; unitless for CLS). */
  readonly value: number;
  /** Delta since the last report for this metric instance. */
  readonly delta: number;
  /** Google's official good / needs-improvement / poor bucket. */
  readonly rating: WebVitalRating;
  /** Unique id for this metric instance (dedup key). */
  readonly id: string;
  /** How the page was navigated to (initial load, reload, bfcache, ...). */
  readonly navigationType: WebVitalNavType;
  /** Current pathname at the moment the metric fired. */
  readonly path: string;
}

/**
 * The callback signature `reportWebVitals` takes. Every consumer implements a
 * thin bridge from `WebVitalReport` to whichever sink they use (analytics
 * adapters, console, no-op, batched RUM beacon).
 */
export type ReportWebVitalsFn = (report: WebVitalReport) => void;
