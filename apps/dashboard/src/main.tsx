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

import { ApplicationFactory } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { StackraRoutingProvider } from "@stackra/routing/react";
import { Path } from "@stackra/support";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import type { WebVitalReport } from "@/lib/telemetry";

import { AppModule } from "@/app.module";
import { containerConfig } from "@/config/container.config";
import { AppErrorBoundary } from "@/lib/error-boundary";
import { reportWebVitals } from "@/lib/telemetry";
import { bootstrapBrandingFromCache } from "@/lib/tenancy";
import { Providers } from "@/providers";
import { routes } from "@/router";

import "@/styles/globals.css";

// Register the project root FIRST — before any framework code (branding
// bootstrap, providers, routing) reads `Path.getRoot()`. The value comes
// from a build-time `define` in `vite.config.ts` so the browser never
// touches `node:fs` to discover its own root. See `Path.setRoot` in
// `@stackra/support` for the full contract.
Path.setRoot(__STACKRA_ROOT__);

// Paint any cached tenant brand BEFORE React mounts. This eliminates the
// flash-of-default-theme on repeat visits to tenant subdomains — the CSS
// variables land on `<html>` in the same synchronous tick as the module
// evaluation, ahead of the first browser paint. See branding-boot.ts.
bootstrapBrandingFromCache();

/**
 * Async boot — the DI container has to resolve BEFORE React mounts so
 * `StackraRoutingProvider` can read `ROUTE_REGISTRY` +
 * `ROUTING_CONFIG` from the container context, and so every
 * downstream `useInject(...)` call resolves.
 *
 * The container is built once, exposed via `ContainerProvider`, and
 * lives for the tab's entire lifetime.
 */
async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element "#root" was not found in the document.');
  }

  // Bootstrap the `@stackra/container` DI graph from `AppModule`. Every
  // framework subsystem (routing, SEO, config, analytics, guards,
  // middleware) becomes reachable via `useInject(TOKEN)` after this.
  const app = await ApplicationFactory.create(AppModule, await containerConfig());

  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <ContainerProvider context={app}>
          <Providers>
            {/*
             * `<StackraRoutingProvider>` owns the router — it calls
             * `createBrowserRouter(routes)` internally and mounts
             * RRv7's `<RouterProvider>`. NO outer `<BrowserRouter>`
             * needed; the routes come from `router.tsx` where every
             * entry is authored via `defineRoute(...)`.
             */}
            <StackraRoutingProvider routes={routes} />
          </Providers>
        </ContainerProvider>
      </AppErrorBoundary>
    </StrictMode>,
  );
}

// Fire-and-log the boot — any container-resolution error surfaces
// before React ever mounts. `AppErrorBoundary` cannot catch this
// (it lives inside the render tree), so a top-level try/catch is
// the right shape for a hard boot failure.
bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Application bootstrap failed:", err);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    // Minimal fallback that doesn't depend on React — a full-screen
    // error message with the underlying reason. Better than an
    // eternal blank page while the operator debugs.
    rootElement.innerHTML = `
      <div style="display:flex;min-height:100dvh;align-items:center;justify-content:center;font-family:system-ui;padding:2rem">
        <div style="max-width:640px">
          <h1 style="font-size:1.5rem;margin-bottom:1rem">Application failed to start</h1>
          <p style="opacity:.7;margin-bottom:1rem">The DI container could not resolve. Check the browser console for details.</p>
          <pre style="background:#00000010;padding:1rem;border-radius:.5rem;overflow:auto;font-size:.85rem">${String(err instanceof Error ? err.message : err)}</pre>
        </div>
      </div>
    `;
  }
});

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
