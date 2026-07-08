/**
 * @file main.tsx
 * @module main
 *
 * @description
 * Boot entrypoint for the dashboard SPA. Four responsibilities, in order:
 *
 *   1. **Paint the brand.** {@link bootstrapBrandingFromCache} reads the
 *      cached tenant palette from `localStorage` and applies it to `<html>`
 *      synchronously — before React mounts — so returning visitors never
 *      see a flash of the default theme. Cache miss is a no-op; the
 *      tenancy provider refetches shortly after and paints the fresh
 *      brand.
 *   2. **Mount the tree.** `createRoot` on `#root`, wrapped in `<StrictMode>`
 *      for double-render invariance checks in dev.
 *   3. **Guard the tree.** {@link AppErrorBoundary} sits OUTSIDE
 *      `<BrowserRouter>` and `<Providers>` so a broken router / provider
 *      construction still surfaces the fallback instead of a white screen.
 *      See the error-boundary docblock for the full rationale.
 *   4. **Report vitals.** {@link reportWebVitals} registers the Core Web
 *      Vitals observers (CLS, INP, LCP, TTFB, FCP) at idle time so RUM
 *      never competes with hydration or the first paint. See the telemetry
 *      README for the fan-out story.
 *
 * The web-vitals bridge is a placeholder for Wave 1 — it logs to console in
 * dev and no-ops in production. Wave 1 batch B routes it through the
 * shared `AnalyticsProvider` (see the TODO below).
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import type { WebVitalReport } from "@/lib/telemetry";

import { App } from "@/App";
import { AppErrorBoundary } from "@/lib/error-boundary";
import { reportWebVitals } from "@/lib/telemetry";
import { bootstrapBrandingFromCache } from "@/lib/tenancy";
import { Providers } from "@/providers";

import "@/styles/globals.css";

// Paint any cached tenant brand BEFORE React mounts. This eliminates the
// flash-of-default-theme on repeat visits to tenant subdomains — the CSS
// variables land on `<html>` in the same synchronous tick as the module
// evaluation, ahead of the first browser paint. See branding-boot.ts.
bootstrapBrandingFromCache();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" was not found in the document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <Providers>
          <App />
        </Providers>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);

/**
 * TODO(wave-1-batch-b): route through the analytics context once
 * `AnalyticsProvider` is mounted in `providers.tsx`. The final shape will
 * pull `useAnalytics()` inside a top-level component and call
 * `analytics.track("web_vital", report)`. For now, log to console in dev so
 * a developer sees the CLS spike after their change without a dashboard,
 * and no-op in prod so we don't spam the console for real users.
 */
function reportWebVitalToAnalytics(report: WebVitalReport): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info("[web-vitals]", report.metric, report.value.toFixed(2), report.rating);
  }
}

reportWebVitals(reportWebVitalToAnalytics);
