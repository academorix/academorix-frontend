/**
 * @file vercel.adapter.ts
 * @module @academorix/analytics/adapters/vercel
 *
 * @description
 * Adapter for Vercel Analytics (`@vercel/analytics`). The SDK is
 * loaded via dynamic import at call time so:
 *   - Apps that don't ship Vercel Analytics don't pay the bundle cost.
 *   - Apps that DO ship it can enable this adapter with one config line.
 *
 * ## Installation (in the consuming app)
 *
 * ```bash
 * pnpm --filter @academorix/dashboard add @vercel/analytics
 * ```
 *
 * Then wire the adapter into the provider:
 *
 * ```tsx
 * import { vercelAnalyticsAdapter } from "@academorix/analytics/adapters/vercel";
 *
 * <AnalyticsProvider adapters={[vercelAnalyticsAdapter]}>{children}</AnalyticsProvider>
 * ```
 *
 * ## What the adapter maps
 *
 *   - `track(name, props)` → `track(name, props)` from `@vercel/analytics`.
 *   - `page(view)`         → `pageView(view.path)` (Vercel auto-tracks
 *     the page's `document.title`).
 *   - `identify()`         → no-op. Vercel Analytics is anonymous;
 *     identity goes through Speed Insights instead, which we don't
 *     use here.
 *   - `reset()`            → no-op.
 *
 * ## Server-safety
 *
 * The adapter no-ops when `typeof window === "undefined"` so calls
 * from Server Components / SSR don't attempt to load the client SDK.
 */

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./analytics-adapter.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VercelAnalyticsModule = any;

/**
 * Lazy-load the Vercel Analytics SDK once and reuse the promise. The
 * import string is a literal so bundlers can still statically detect
 * the dep — apps that don't install `@vercel/analytics` will fail the
 * dynamic import gracefully (the adapter no-ops and logs a warning).
 */
let vercelModulePromise: Promise<VercelAnalyticsModule | null> | null = null;

function loadVercelAnalytics(): Promise<VercelAnalyticsModule | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!vercelModulePromise) {
    // Optional peer dep — this package intentionally doesn't declare
    // `@vercel/analytics` so apps that don't use it pay nothing. The
    // dynamic import fails gracefully at runtime when the SDK is
    // absent (see the `.catch` below).

    // @ts-expect-error — optional peer dep, resolved at runtime only.
    vercelModulePromise = import(/* webpackIgnore: true */ "@vercel/analytics").catch(() => {
      // eslint-disable-next-line no-console
      console.warn(
        "[@academorix/analytics] Vercel adapter enabled but @vercel/analytics is not installed. " +
          "Run `pnpm add @vercel/analytics` in the consuming app or remove the adapter.",
      );

      return null;
    });
  }

  return vercelModulePromise;
}

/**
 * The Vercel Analytics adapter singleton. Registered in an app's
 * `<AnalyticsProvider adapters={[...]} />` prop.
 */
export const vercelAnalyticsAdapter: AnalyticsAdapter = {
  name: "vercel",

  track(name: string, properties?: AnalyticsProperties): void {
    void loadVercelAnalytics().then((mod) => {
      mod?.track(name, properties as Record<string, unknown> | undefined);
    });
  },

  identify(_identity: AnalyticsIdentity): void {
    // Vercel Analytics is intentionally anonymous; identify is a no-op.
  },

  page(view: AnalyticsPageView): void {
    void loadVercelAnalytics().then((mod) => {
      // Vercel's <Analytics /> component auto-tracks route changes;
      // the manual `pageView` API is only exported on the injected
      // client instance, not the static API. Manual page tracking is
      // typically unnecessary — but we call `track` with a
      // synthetic event name so custom SPA routers can still emit
      // page events into the same feed.
      mod?.track("$pageview", { path: view.path, title: view.title });
    });
  },

  reset(): void {
    // No-op — Vercel Analytics is anonymous.
  },
};
