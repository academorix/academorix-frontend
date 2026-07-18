/**
 * @file react-router.config.ts
 * @module @academorix/dashboard/react-router.config
 *
 * @description
 * Build-time router config consumed by TWO framework consumers:
 *
 *   - `router()` Vite plugin (`@stackra/routing/vite`) — walks the
 *     exported route tree during build to drive the prerender pipeline
 *     and prints the subdomain-aware dev startup banner.
 *   - `stackra host` CLI (`@stackra/routing/console`) — reads
 *     `rootDomain` + `devSubdomains` to seed `/etc/hosts` with local
 *     entries for `<sub>.academorix.app` subdomain testing.
 *
 * ## Fields
 *
 *   - `basename` — URL base path (`'/'` for a root-mounted SPA).
 *   - `rootDomain` — parent domain every dev subdomain lives under.
 *     Mirrors `RoutingModule.forRoot({ rootDomain })` in
 *     `src/app.module.ts` + the `router()` plugin options in
 *     `src/config/vite.config.ts`. Change in all three when it
 *     changes.
 *   - `devSubdomains` — subdomains this app services under
 *     `rootDomain`. The host CLI writes one line per entry to
 *     `/etc/hosts`; the root + `www` are always included and do NOT
 *     need to be listed.
 *   - `routes` — the top-level route tree; entries are `IRouteRecord`
 *     values produced by `defineRoute(...)` (see `src/router.tsx`).
 *
 * The `ssr` field is intentionally absent — `@stackra/routing` is
 * locked to `ssr: false` per PLAN v3 (SSR is not a supported path for
 * the dashboard).
 */

import { defineRouterConfig } from "@stackra/routing";

import { routes } from "./src/router";

export default defineRouterConfig({
  basename: "/",

  // Parent domain for every dev subdomain. Mirrors:
  //   • src/app.module.ts        → RoutingModule.forRoot({ rootDomain })
  //   • src/config/vite.config.ts → router().options.rootDomain
  rootDomain: "academorix.app",

  // Dev subdomains for local testing (root + www are always emitted).
  //   docs  — future documentation site.
  //   admin — central-admin / Academorix staff surface.
  //   acme  — sample tenant workspace.
  //   test  — sandbox tenant for e2e / experiments.
  devSubdomains: ["docs", "admin", "acme", "test"],

  routes,
});
