/**
 * @file default-routing-config.constants.ts
 * @module @stackra/routing/core/constants
 * @description Canonical default value for `IRoutingModuleOptions`.
 *
 *   Applied by `mergeConfig(...)` as the base layer under every user
 *   options object handed to `RoutingModule.forRoot(...)` /
 *   `RoutingModule.forRootAsync(...)`. Single source of truth so both
 *   forms produce the exact same merged config.
 */

import type { IRoutingModuleOptions } from "@stackra/contracts";

/**
 * Default routing module configuration.
 *
 * Every field mirrors an `IRoutingModuleOptions` property; when a field
 * is `undefined` in the default, the corresponding runtime code path
 * treats "unset" as its own case (e.g. `rootDomain` unset → subdomain
 * matcher throws when routes reference it).
 */
export const DEFAULT_ROUTING_CONFIG: IRoutingModuleOptions = {
  // Root URL — mounted at the site root by default.
  basename: "/",
  // No default root domain — apps that need subdomain matching MUST set
  // this explicitly.
  rootDomain: undefined,
  // `.localhost` gives zero-config subdomain routing in dev.
  devMode: "localhost",
  // Query-param override is a dev convenience; off in production.
  allowDevSubdomainQuery: false,
  // Banner-only cosmetic list. The plugin still resolves subdomains
  // from `defineRouterConfig({routes})`.
  devSubdomains: [],
  // AI integration is opt-in; the F.2 wiring adds the AiRouteContext.
  ai: false,
  // Devtools contribution auto-wires when @stackra/devtools is
  // installed; the flag lets consumers opt out.
  devtools: true,
  // Prerender defaults are wired here so `mergeConfig` doesn't need
  // to reach into a nested object with `??=` semantics.
  prerender: { enabled: true, outputDir: "dist" },
  // No fallbacks by default — the routing runtime substitutes
  // framework-defaults when a slot is unresolved.
  fallbacks: undefined,
  // No site-wide SEO defaults — set them explicitly per app.
  seo: undefined,
};
