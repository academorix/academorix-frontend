/**
 * @file sentry.adapter.ts
 * @module @academorix/analytics/adapters/sentry
 *
 * @description
 * Adapter for Sentry (`@sentry/react` or `@sentry/nextjs`). Bridges
 * analytics-shaped calls into Sentry's breadcrumb + user-context APIs
 * so events surface next to any errors captured in the same session.
 *
 * We DO NOT initialize Sentry from here — apps that use Sentry init
 * it in their own boot code with the SDK's platform-specific bindings
 * (`Sentry.init(...)` at module load in Vite; `sentry.client.config.ts`
 * in Next.js). This adapter merely READS from the already-loaded SDK.
 *
 * ## Mapping
 *
 *   - `track(name, props)` → `Sentry.addBreadcrumb({ category: "analytics", message: name, data: props })`.
 *   - `identify(id + traits)` → `Sentry.setUser({ id, email, ... })`.
 *   - `page(view)`  → `Sentry.addBreadcrumb({ category: "navigation", ... })`.
 *   - `reset()`     → `Sentry.setUser(null)`.
 *
 * ## Installation
 *
 * ```bash
 * # Vite (dashboard)
 * pnpm --filter @academorix/dashboard add @sentry/react
 *
 * # Next.js (landing-page)
 * pnpm --filter @academorix/landing-page add @sentry/nextjs
 * ```
 *
 * The adapter loads whichever is available; specify the module path
 * via `createSentryAnalyticsAdapter({ modulePath: "@sentry/nextjs" })`
 * when both are installed.
 */

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "./analytics-adapter.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryModule = any;

/** Options accepted by {@link createSentryAnalyticsAdapter}. */
export interface SentryAdapterOptions {
  /**
   * Package path to load. `"@sentry/react"` in Vite, `"@sentry/nextjs"`
   * in Next.js. Default `"@sentry/react"`.
   */
  modulePath?: string;
}

/**
 * Factory that builds a Sentry adapter with a configurable module path.
 * Vite apps use `"@sentry/react"`; Next.js apps use `"@sentry/nextjs"`.
 */
export function createSentryAnalyticsAdapter(options: SentryAdapterOptions = {}): AnalyticsAdapter {
  const modulePath = options.modulePath ?? "@sentry/react";

  let modulePromise: Promise<SentryModule | null> | null = null;

  const loadSentry = (): Promise<SentryModule | null> => {
    if (typeof window === "undefined") {
      return Promise.resolve(null);
    }

    if (modulePromise) {
      return modulePromise;
    }

    modulePromise = import(/* webpackIgnore: true */ modulePath).catch(() => {
      // eslint-disable-next-line no-console
      console.warn(
        `[@academorix/analytics] Sentry adapter enabled but ${modulePath} is not installed. ` +
          `Run \`pnpm add ${modulePath}\` in the consuming app or remove the adapter.`,
      );

      return null;
    });

    return modulePromise;
  };

  return {
    name: "sentry",

    track(name: string, properties?: AnalyticsProperties): void {
      void loadSentry().then((sentry) =>
        sentry?.addBreadcrumb({
          category: "analytics",
          message: name,
          level: "info",
          data: properties,
        }),
      );
    },

    identify(identity: AnalyticsIdentity): void {
      void loadSentry().then((sentry) =>
        sentry?.setUser({
          id: identity.id,
          email: identity.email,
          username: identity.name,
          tenantId: identity.tenantId,
          role: identity.role,
        }),
      );
    },

    page(view: AnalyticsPageView): void {
      void loadSentry().then((sentry) =>
        sentry?.addBreadcrumb({
          category: "navigation",
          message: view.path,
          level: "info",
          data: { title: view.title },
        }),
      );
    },

    reset(): void {
      void loadSentry().then((sentry) => sentry?.setUser(null));
    },
  };
}

/** Default Sentry adapter for Vite/React apps. */
export const sentryAnalyticsAdapter: AnalyticsAdapter = createSentryAnalyticsAdapter();
