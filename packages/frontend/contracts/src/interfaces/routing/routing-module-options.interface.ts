/**
 * @file routing-module-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Configuration shape for `RoutingModule.forRoot(options)`.
 */

/**
 * Dev-mode setup mode for local subdomain testing.
 *
 * - `localhost` — `*.localhost` subdomain routing (zero setup).
 * - `hosts-file` — the app expects real subdomains under `rootDomain`
 *   (requires `pnpm stackra dev-hosts`).
 * - `proxy` — a reverse-proxy layer handles the subdomain routing.
 */
export type IDevMode = "localhost" | "hosts-file" | "proxy";

/**
 * Root configuration for `RoutingModule.forRoot({...})`.
 */
export interface IRoutingModuleOptions {
  /**
   * URL base path — passed through to RRv7's `basename`.
   *
   * @default '/'
   */
  readonly basename?: string;

  /**
   * Root domain for subdomain matchers.
   *
   * @example `'academorix.app'`
   */
  readonly rootDomain?: string;

  /**
   * Dev-mode setup mode.
   *
   * @default 'localhost'
   */
  readonly devMode?: IDevMode;

  /**
   * When `true`, dev requests may override the parsed subdomain via
   * the `?_subdomain=` query param. Off in production.
   *
   * @default false
   */
  readonly allowDevSubdomainQuery?: boolean;

  /**
   * List of dev subdomains to advertise in the Vite startup banner.
   * Purely cosmetic — the actual matcher list comes from
   * `defineRouterConfig({routes})`.
   *
   * @default []
   */
  readonly devSubdomains?: readonly string[];

  /**
   * When `true`, `@stackra/ai` is wired into the routing tree —
   * `<AiRouteContext>` mounts + `navigateTool` binds. Off by default.
   *
   * @default false
   */
  readonly ai?: boolean;

  /**
   * When `false`, the routing module does NOT contribute its
   * devtools panel + inspector source (even if `@stackra/devtools` is
   * installed). Defaults to `true`.
   *
   * @default true
   */
  readonly devtools?: boolean;

  /**
   * Prerender output configuration.
   */
  readonly prerender?: {
    /** When `false`, the build-time prerender walk is skipped. */
    readonly enabled?: boolean;
    /** Output directory (relative to Vite root). */
    readonly outputDir?: string;
  };

  /**
   * Override the framework's default fallback components. Consumers
   * that want a bespoke `<Skeleton>` grid or `<EmptyState>` design
   * plug them in here.
   */
  readonly fallbacks?: {
    /** Framework-default LoadingComponent replacement. */
    readonly LoadingComponent?: unknown;
    /** Framework-default PendingComponent replacement. */
    readonly PendingComponent?: unknown;
    /** Framework-default ErrorComponent replacement. */
    readonly ErrorComponent?: unknown;
    /** Framework-default NotFoundComponent replacement. */
    readonly NotFoundComponent?: unknown;
    /** Framework-default EmptyComponent replacement. */
    readonly EmptyComponent?: unknown;
  };

  /**
   * Site-wide SEO defaults, merged at the bottom of every route's SEO
   * chain. The nested SEO service reads these.
   */
  readonly seo?: {
    /**
     * Absolute base URL — used to absolutise relative canonical /
     * OpenGraph URLs.
     */
    readonly baseUrl?: string;
    /** Default SEO descriptor. */
    readonly defaults?: unknown;
  };
}
