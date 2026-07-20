/**
 * @file index.ts
 * @module @stackra/routing/vite
 * @description Public API for the `@stackra/routing/vite` subpath.
 *
 *   Exports:
 *
 *   - `router()` — the main Vite plugin factory. Wires the dev
 *     subdomain middleware, the startup banner, the
 *     `virtual:stackra-routing/dev-subdomain` module, and the build-
 *     time prerender pipeline.
 *   - `prerenderRoutes(...)` — programmatic access to the prerender
 *     pipeline for tools that run it outside the plugin's
 *     `closeBundle` hook (e.g. `pnpm stackra build`).
 *   - The plugin option / result interfaces + the `NONCE_PLACEHOLDER`
 *     constant runtime CSP layers substitute against.
 *
 *   Consumers who only want the plugin write:
 *
 *   ```typescript
 *   import { router } from '@stackra/routing/vite';
 *   ```
 *
 *   No re-exports from `@stackra/contracts` (per contract-reexports rule).
 */

// ── Main plugin factory ────────────────────────────────────────
export { router } from "./router-plugin";

// ── Plugin option / result interfaces ──────────────────────────
export type {
  IRouterPluginOptions,
  IRouterPluginPrerenderOptions,
  IPrerenderConfig,
  IPrerenderOutput,
  IPrerenderError,
  IPrerenderResult,
} from "./interfaces";

// ── Prerender pipeline (programmatic) ──────────────────────────
export {
  prerenderRoutes,
  loadRouterConfig,
  bootstrapBuildContainer,
  walkRoutes,
  type IWalkedRoute,
  evaluateLazyRoute,
  type IEvaluatedRouteModule,
  renderPrerender,
  resolveRoutePath,
  buildHtmlShell,
  type IBuildHtmlShellInput,
  NONCE_PLACEHOLDER,
  computeOutputFilePath,
  writePrerenderOutput,
} from "./prerender";

// ── Subdomain helpers (used by plugin internals + testing) ──────
export {
  parseSubdomain,
  createDevSubdomainMiddleware,
  type DevMiddleware,
  type IDevSubdomainMiddlewareOptions,
  VIRTUAL_DEV_SUBDOMAIN_ID,
  RESOLVED_DEV_SUBDOMAIN_ID,
  buildDevSubdomainModuleSource,
} from "./subdomain";

// ── Banner ─────────────────────────────────────────────────────
export { printStartupBanner, type IStartupBannerInput } from "./banner";
