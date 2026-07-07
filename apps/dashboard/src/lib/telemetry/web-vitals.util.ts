/**
 * @file web-vitals.util.ts
 * @module lib/telemetry/web-vitals.util
 *
 * @description
 * Core Web Vitals reporting for the dashboard SPA. Uses the `web-vitals`
 * library (Google) to observe CLS, INP, LCP, TTFB, and FCP, then fans them
 * out to whichever analytics adapters the app has configured (via the
 * caller-supplied {@link ReportWebVitalsFn} bridge).
 *
 * ## Rationale
 *
 * Real-user monitoring (RUM) of Core Web Vitals is a non-negotiable for an
 * enterprise SPA. Google uses them as ranking signals; product dashboards
 * use them as SLO alarms. Reporting them ourselves lets us slice by tenant /
 * route / device / release version — signal Vercel Speed Insights alone
 * can't capture because it doesn't know about our tenant identity.
 *
 * ## Events emitted
 *
 * Every metric fires a `web_vital` analytics event carrying the
 * {@link WebVitalReport} shape:
 *
 *   - `metric`         "CLS" | "INP" | "LCP" | "TTFB" | "FCP"
 *   - `value`          number (ms for LCP/FCP/TTFB/INP; unitless for CLS)
 *   - `delta`          number — change since the last report for this instance
 *   - `rating`         "good" | "needs-improvement" | "poor"
 *   - `id`             string — unique metric instance id (dedup key)
 *   - `navigationType` "navigate" | "reload" | "back-forward" |
 *                      "back-forward-cache" | "prerender" | "restore"
 *   - `path`           `window.location.pathname` at report time
 *
 * The consumer picks up the event via the analytics adapter fan-out.
 *
 * ## Deferred initialisation
 *
 * The observers are registered inside `requestIdleCallback` (or a
 * `setTimeout(0)` fallback) so they don't compete with hydration and the
 * initial render for main-thread time. Called ONCE at boot; observers stay
 * alive for the SPA lifetime (INP fires repeatedly as the user interacts,
 * CLS re-fires after each layout shift, etc.).
 *
 * ## FID vs INP
 *
 * `web-vitals@5` retired `onFID` — INP replaced FID as a Core Web Vital in
 * March 2024. Only INP is observed here. Consumers coming from the older
 * `onFID` signal should treat INP as the drop-in replacement.
 *
 * ## SSR / test safety
 *
 * Every entry point guards on `typeof window === "undefined"` so this module
 * is safe to import from test files that stub the DOM out. The dynamic
 * `import("web-vitals")` is triggered only inside the idle callback, so the
 * observer bundle stays out of the critical-path graph even when the caller
 * imports {@link reportWebVitals} at the top of `main.tsx`.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/main.tsx
 * import { reportWebVitals } from "@/lib/telemetry";
 *
 * reportWebVitals((report) => {
 *   analytics.track("web_vital", report);
 * });
 * ```
 *
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/web-vitals
 *
 * @related web-vitals.type.ts — type aliases shared with consumers.
 * @related index.ts           — barrel re-exporting the public surface.
 */

import type { ReportWebVitalsFn, WebVitalReport } from "./web-vitals.type";
import type { CLSMetric, FCPMetric, INPMetric, LCPMetric, Metric, TTFBMetric } from "web-vitals";

// ---------------------------------------------------------------------------
// Module-scoped guard — prevents double-registration on hot-reload / retry.
// ---------------------------------------------------------------------------

/**
 * Set once we have kicked off the observer registration. The `web-vitals`
 * library's `onXxx` functions each install their own PerformanceObserver;
 * registering them twice would produce duplicate reports for every metric,
 * making dedup a downstream problem. `reportWebVitals` no-ops after the
 * first call.
 */
let hasRegistered = false;

// ---------------------------------------------------------------------------
// Idle scheduling helper
// ---------------------------------------------------------------------------

/**
 * Schedules `callback` for the next browser idle period. Falls back to a
 * `setTimeout(0)` on browsers that lack `requestIdleCallback` (Safari <
 * v17.4, older webview shells).
 *
 * We deliberately do NOT use `queueMicrotask` — microtasks run before the
 * next paint, defeating the point of deferring past hydration. A macrotask
 * (setTimeout) or idle-callback both yield to the browser first.
 */
function scheduleIdle(callback: () => void): void {
  if (typeof window === "undefined") {
    return;
  }

  const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;

  if (typeof ric === "function") {
    ric(callback);

    return;
  }

  window.setTimeout(callback, 0);
}

// ---------------------------------------------------------------------------
// Metric → report translator
// ---------------------------------------------------------------------------

/**
 * Turns the raw {@link Metric} payload from `web-vitals` into the
 * {@link WebVitalReport} shape our analytics fan-out expects. Drops
 * `entries` (a raw PerformanceEntry array — too large for most sinks) and
 * appends the current pathname so consumers can slice by route without an
 * extra hop.
 */
function toReport(
  metric: CLSMetric | FCPMetric | INPMetric | LCPMetric | TTFBMetric,
): WebVitalReport {
  return {
    metric: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: typeof window === "undefined" ? "" : window.location.pathname,
  };
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

/**
 * Registers Core Web Vitals observers and hands every metric to `report`.
 *
 * Behaviour:
 *
 *   - No-op on the server (`typeof window === "undefined"` short-circuit).
 *   - No-op on the second call (module-scoped `hasRegistered` guard) so
 *     double-mount in `<StrictMode>` doesn't produce duplicate reports.
 *   - The `web-vitals` module is dynamic-imported inside the idle callback,
 *     keeping the observer code out of the critical-path bundle graph.
 *   - Failures during the dynamic import are swallowed with a `console.warn`
 *     — telemetry MUST NEVER break the app.
 *
 * @param report Callback invoked once per metric fire. Consumers typically
 *               bridge this into an analytics `track` call.
 */
export function reportWebVitals(report: ReportWebVitalsFn): void {
  if (typeof window === "undefined") {
    return;
  }

  if (hasRegistered) {
    return;
  }

  hasRegistered = true;

  scheduleIdle(() => {
    // Dynamic import so the `web-vitals` module doesn't land in the
    // critical-path chunk. Keeps the initial JS budget honest.
    import("web-vitals")
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        const forward = (metric: Metric): void => {
          try {
            // `web-vitals` narrows the union at the callsite so this cast is
            // safe — every `onXxx` fires the corresponding `XxxMetric` shape,
            // and each of those extends the shared `Metric` base type.
            report(toReport(metric as CLSMetric | FCPMetric | INPMetric | LCPMetric | TTFBMetric));
          } catch (error) {
            // A broken consumer must never break the fan-out. Swallow and
            // surface via console.error so telemetry stays observable
            // without wedging the observer.
            console.error("[web-vitals] report callback threw", error);
          }
        };

        onCLS(forward);
        onFCP(forward);
        onINP(forward);
        onLCP(forward);
        onTTFB(forward);
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.warn("[web-vitals] observer registration failed", error);
      });
  });
}

/**
 * Test hook — resets the module-scoped registration guard so the observer
 * can be registered again in a fresh test case. Not for production use.
 *
 * @internal
 */
export function __resetWebVitalsForTests(): void {
  hasRegistered = false;
}
