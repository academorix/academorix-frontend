/**
 * @file posthog.adapter.ts
 * @module @academorix/analytics/adapters/posthog
 *
 * @description
 * Adapter for PostHog Product Analytics (`posthog-js`). Handles
 * lazy-load + init + fan-out mapping. Auto-captures are OFF by
 * default so we don't accidentally track PII (email fields, etc.)
 * from CRUD forms — apps that want autocapture enable it in the
 * `init()` config below.
 *
 * ## Installation (in the consuming app)
 *
 * ```bash
 * pnpm --filter @academorix/dashboard add posthog-js
 * ```
 *
 * ## Configuration
 *
 * The adapter reads its config from env vars via
 * `@academorix/core/env`, so apps only add the vars to their
 * `.env` — no code changes:
 *
 *   - `VITE_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_KEY` — API key.
 *   - `VITE_POSTHOG_HOST` / `NEXT_PUBLIC_POSTHOG_HOST` — API host
 *     (default `https://us.i.posthog.com`).
 *
 * The adapter no-ops when the key is missing so a build without
 * a PostHog config doesn't send junk data to the wrong project.
 */

import { env } from "@academorix/core/env";

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./analytics-adapter.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostHogModule = any;

/** Cache the loaded module + init promise across calls. */
let posthogPromise: Promise<PostHogModule | null> | null = null;

/**
 * Reads config from env at first call. Returns the initialised
 * PostHog module (or `null` when disabled).
 */
function loadPostHog(): Promise<PostHogModule | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (posthogPromise) {
    return posthogPromise;
  }

  // Support both Vite (VITE_*) and Next.js (NEXT_PUBLIC_*) prefixes.
  const apiKey = env("VITE_POSTHOG_KEY", "") || env("NEXT_PUBLIC_POSTHOG_KEY", "");

  if (!apiKey) {
    posthogPromise = Promise.resolve(null);

    return posthogPromise;
  }

  const apiHost =
    env("VITE_POSTHOG_HOST", "") ||
    env("NEXT_PUBLIC_POSTHOG_HOST", "") ||
    "https://us.i.posthog.com";

  // Optional peer dep — this package intentionally doesn't declare
  // `posthog-js` so apps that don't use it pay nothing. The dynamic
  // import fails gracefully at runtime when the SDK is absent.
  posthogPromise = // @ts-expect-error — optional peer dep, resolved at runtime only.
    (import(/* webpackIgnore: true */ "posthog-js") as Promise<{ default: PostHogModule }>)
      .then((mod) => {
        const posthog: PostHogModule = mod.default;

        posthog.init(apiKey, {
          api_host: apiHost,
          // Off by default — we track explicit events, not every click.
          autocapture: false,
          capture_pageview: false, // we call `page()` explicitly
          person_profiles: "identified_only", // only identified users get a profile
          loaded: () => undefined,
        });

        return posthog;
      })
      .catch(() => {
        // eslint-disable-next-line no-console
        console.warn(
          "[@academorix/analytics] PostHog adapter enabled but posthog-js is not installed. " +
            "Run `pnpm add posthog-js` in the consuming app or remove the adapter.",
        );

        return null;
      });

  return posthogPromise;
}

/**
 * The PostHog adapter singleton. Registered in an app's
 * `<AnalyticsProvider adapters={[...]} />` prop.
 */
export const posthogAnalyticsAdapter: AnalyticsAdapter = {
  name: "posthog",

  track(name: string, properties?: AnalyticsProperties): void {
    void loadPostHog().then((posthog) => posthog?.capture(name, properties));
  },

  identify(identity: AnalyticsIdentity): void {
    const { id, ...traits } = identity;

    void loadPostHog().then((posthog) => posthog?.identify(id, traits));
  },

  page(view: AnalyticsPageView): void {
    void loadPostHog().then((posthog) =>
      posthog?.capture("$pageview", {
        $current_url: view.path,
        title: view.title,
        referrer: view.referrer,
      }),
    );
  },

  reset(): void {
    void loadPostHog().then((posthog) => posthog?.reset());
  },
};
