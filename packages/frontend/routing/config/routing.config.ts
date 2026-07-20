/**
 * @file routing.config.ts
 * @module app/config/routing
 * @description Reference `@stackra/routing` config, published to app
 *   `config/routing.config.ts` via `stackra vendor:publish --tag=routing-config`.
 *
 *   The app's copy is the source of truth once published — this file is
 *   only the starter template. Every field is optional; unspecified
 *   fields fall back to `DEFAULT_ROUTING_CONFIG` from `@stackra/routing`.
 *
 *   Import this returned value into your `AppModule` via
 *   `RoutingModule.forRoot(routingConfig)`.
 */

import type { IRoutingModuleOptions } from "@stackra/contracts";

/**
 * Application-owned routing configuration.
 *
 * Every field is optional — the runtime merges what you set here with
 * `DEFAULT_ROUTING_CONFIG` inside `RoutingModule.forRoot(...)`.
 */
const routingConfig: Partial<IRoutingModuleOptions> = {
  /**
   * Base path the router mounts under. Almost every app leaves this at
   * `"/"`. Set it when the app is served under a sub-path (e.g. behind
   * an Nginx location block at `/dashboard/`).
   */
  basename: "/",

  /**
   * Root domain used to expand `match.subdomain` predicates at runtime.
   * The Vite plugin (`@stackra/routing/vite`) owns dev-mode subdomain
   * resolution, so set this in production configs only.
   *
   * @example "academorix.app"
   */
  // rootDomain: "example.com",

  /**
   * SEO defaults merged with every route-level `IRouteRecord.seo`
   * descriptor. `<SeoHead />` from `@stackra/routing/react` reads the
   * result at render time.
   */
  seo: {
    /**
     * Site-wide fallback SEO. Every route can override individually via
     * its own `seo` descriptor.
     */
    defaults: {
      titleTemplate: "%s",
      openGraph: {
        siteName: "Your App",
      },
    },
  },

  /**
   * Opt in to AI route context — enables `<AiRouteContext />` and the
   * `useAiRouteContext()` hook. Default: `false` (zero bundle cost when
   * off).
   */
  ai: false,
};

export default routingConfig;
