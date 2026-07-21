/**
 * @file router-plugin-options.interface.ts
 * @module @stackra/routing/vite/interfaces
 * @description Options accepted by the `router(options)` Vite plugin
 *   factory (per PLAN v3.3 + v3.9.2).
 *
 *   Every field is optional — a zero-arg `router()` call yields a
 *   working plugin for a single-domain SPA with no subdomain routing.
 */

import type { IDevMode } from "@stackra/contracts";

/**
 * Prerender-specific settings on the plugin options.
 *
 * Grouped with the outer options because both live under
 * `router({...})`; nothing outside the plugin consumes this shape.
 */
export interface IRouterPluginPrerenderOptions {
  /**
   * When `false`, the build-time prerender walk is skipped entirely.
   * Consumers that ship a fully-dynamic app (no SEO surface) can turn
   * this off to shave build time.
   *
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * Output directory (relative to the Vite `outDir`) where prerendered
   * HTML shells are written. Falls back to Vite's `outDir` root when
   * omitted.
   *
   * @default undefined
   */
  readonly outputDir?: string;
}

/**
 * Options accepted by the `router(options)` factory.
 */
export interface IRouterPluginOptions {
  /**
   * Root domain. When set, the dev middleware parses subdomains
   * against this suffix. Defaults to `undefined` (no subdomain
   * routing in dev).
   *
   * @example `'stackra.app'`
   */
  readonly rootDomain?: string;

  /**
   * Dev-mode subdomain setup.
   *
   * - `'localhost'` (default) — use `*.localhost` (zero setup).
   * - `'hosts-file'` — expects real subdomains under `rootDomain`
   *   (requires `pnpm stackra dev-hosts` to have been run).
   * - `'proxy'` — assume a reverse-proxy layer handles routing.
   *
   * @default 'localhost'
   */
  readonly devMode?: IDevMode;

  /**
   * Dev subdomains to advertise in the Vite startup banner. Purely
   * cosmetic — the actual matcher list comes from the route config.
   *
   * @default []
   */
  readonly devSubdomains?: readonly string[];

  /**
   * When `true`, dev requests may set `?_subdomain=admin` to override
   * the parsed subdomain. Off by default. Ignored in production builds
   * (the plugin only wires the query hook in `serve` mode).
   *
   * @default false
   */
  readonly allowDevSubdomainQuery?: boolean;

  /**
   * Path to `react-router.config.ts`. Resolved relative to Vite root.
   *
   * @default './react-router.config.ts'
   */
  readonly configFile?: string;

  /**
   * Path to the app's DI module (e.g. `'src/app.module.ts'`). The
   * prerender pipeline dynamically imports this to bootstrap a build-
   * time DI container. When omitted, prerender runs without a
   * container — pages that need one will fail their loaders soft
   * (their `ErrorComponent` renders on the emitted page instead of
   * aborting the whole build).
   *
   * @default undefined
   */
  readonly moduleFile?: string;

  /**
   * Prerender output settings.
   */
  readonly prerender?: IRouterPluginPrerenderOptions;
}
