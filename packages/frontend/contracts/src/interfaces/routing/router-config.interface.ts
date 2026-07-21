/**
 * @file router-config.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Shape returned by `defineRouterConfig(...)` — the entry
 *   the Vite `router()` plugin reads at build time and the Stackra
 *   routing provider reads at runtime.
 */

import type { IRouteRecord } from "./route-record.interface";

/**
 * Root router configuration.
 *
 * @example
 * ```typescript
 * // apps/dashboard/react-router.config.ts
 * export default defineRouterConfig({
 *   basename: '/',
 *   rootDomain: 'stackra.app',
 *   devSubdomains: ['www', 'docs', 'admin'],
 *   routes: [
 *     defineRoute({...}),
 *   ],
 * });
 * ```
 */
export interface IRouterConfig {
  /** URL base path the router mounts under. */
  readonly basename?: string;

  /** Top-level route tree. */
  readonly routes: readonly IRouteRecord[];

  /**
   * Root domain for subdomain matchers — required when any route
   * uses `match.subdomain`. The framework subtracts `rootDomain` from
   * the request `Host` header to compute the subdomain.
   *
   * @example `'stackra.app'`
   */
  readonly rootDomain?: string;

  /**
   * Dev subdomains this app services under `rootDomain`. The list is
   * read by the `stackra host` CLI command to seed `/etc/hosts` with
   * one `127.0.0.1 <sub>.<rootDomain>` line per entry, and by the
   * Vite `router()` plugin's startup banner. Purely cosmetic at
   * runtime — the actual subdomain matcher list comes from any route
   * in `routes` that declares `match.subdomain`.
   *
   * The root domain and `www.<rootDomain>` are ALWAYS emitted by the
   * host command; there is no need to list them here.
   *
   * @default []
   * @example `['docs', 'admin', 'acme', 'test']`
   */
  readonly devSubdomains?: readonly string[];
}
