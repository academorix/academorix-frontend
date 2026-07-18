/**
 * @file route-record.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Framework's route record shape — extends RRv7's
 *   `RouteObject` with Stackra-owned fields (guards, middleware, seo,
 *   prerender, mode, match, ...) while keeping the routing / rendering
 *   fields RRv7 owns.
 *
 *   Uses `import type` from `react-router` to keep this file type-only
 *   and avoid a runtime dependency on `react-router` — `@stackra/contracts`
 *   remains zero-runtime.
 */

import type { ComponentType } from "react";
// TYPES ONLY — react-router is declared as a devDependency of
// `@stackra/contracts` so the tsc build sees the type. No runtime
// import.
import type { RouteObject } from "react-router";

import type { IAccessSpec } from "./access-spec.interface";
import type { IErrorProps } from "./error-props.interface";
import type { IHashPredicate } from "./hash-predicate.interface";
import type { IHeaderPredicate } from "./header-predicate.interface";
import type { ILinkTag } from "./link-tag.interface";
import type { IMatcherContext } from "./matcher-context.interface";
import type { IOverlayConfig } from "./overlay-config.interface";
import type { IPageContext } from "./page-context.interface";
import type { IPrerenderContext } from "./prerender-context.interface";
import type { IQueryPredicate } from "./query-predicate.interface";
import type { IRouteHistory } from "./route-history.interface";
import type { IRouteMode } from "./route-mode.interface";
import type { ISubdomainPredicate } from "./subdomain-predicate.interface";

/**
 * Route-level `match` block — pluggable predicates that run BEFORE
 * RRv7's path matcher. All fields optional; the framework only
 * evaluates the ones present.
 */
export interface IRouteMatchSpec {
  /**
   * Subdomain matcher — a predicate function or the direct output of
   * `subdomain.exact(...)` / etc. from `@stackra/routing/matchers`.
   */
  readonly subdomain?: ISubdomainPredicate;

  /** Query-string matcher. */
  readonly query?: IQueryPredicate;

  /** Request-header matcher. */
  readonly header?: IHeaderPredicate;

  /** URL-hash matcher. */
  readonly hash?: IHashPredicate;

  /**
   * Custom async matcher — invoked at runtime (never at build time in
   * v1 — see PLAN v3.4). Escape hatch for tenant lookups, feature
   * flags, etc.
   */
  readonly custom?: (context: IMatcherContext) => boolean | Promise<boolean>;
}

/**
 * Prerender specification for a route.
 *
 * - `true` — prerender once with `params = {}`.
 * - `false` / omitted — SPA fallback only.
 * - `readonly TParams[]` — literal list of param bags.
 * - `(ctx) => ...` — build-time function returning param bags.
 */
export type IPrerenderSpec<TParams extends Record<string, string> = Record<string, string>> =
  | boolean
  | readonly TParams[]
  | ((ctx: IPrerenderContext) => Promise<readonly TParams[]> | readonly TParams[]);

/**
 * Framework route record. Extends RRv7's `RouteObject` (via `Omit` to
 * strip fields we replace) and layers on Stackra-owned fields for
 * guards, middleware, seo, prerender, matchers, and presentation mode.
 */
export interface IRouteRecord<TParams = Record<string, string>, TData = unknown> extends Omit<
  RouteObject,
  | "Component"
  | "element"
  | "errorElement"
  | "ErrorBoundary"
  | "HydrateFallback"
  | "loader"
  | "action"
  | "handle"
  | "children"
  | "shouldRevalidate"
  | "lazy"
  | "id"
  | "middleware"
  | "path"
  | "index"
  | "caseSensitive"
> {
  // ── Routing ─────────────────────────────────────────────────────
  /** Unique route id — auto-generated when omitted. */
  readonly id?: string;

  /** Path pattern. */
  readonly path?: string;

  /** Whether the route is an index route. */
  readonly index?: boolean;

  /** Case sensitivity of the path match. */
  readonly caseSensitive?: boolean;

  /** Nested child routes. */
  readonly children?: readonly IRouteRecord[];

  // ── Rendering ───────────────────────────────────────────────────
  /** Component rendered when the route matches. */
  readonly Component?: ComponentType;

  /** Fallback rendered while the loader / lazy component fetches. */
  readonly LoadingComponent?: ComponentType;

  /** Fallback rendered during a route transition. */
  readonly PendingComponent?: ComponentType;

  /** Fallback rendered when the loader / component throws. */
  readonly ErrorComponent?: ComponentType<IErrorProps>;

  /** Fallback rendered when `notFound()` fires. */
  readonly NotFoundComponent?: ComponentType;

  /**
   * Fallback rendered when the loader returns a value that `isEmpty`
   * classifies as empty.
   */
  readonly EmptyComponent?: ComponentType;

  /** Predicate that flags the loader data as "empty". */
  readonly isEmpty?: (data: TData) => boolean;

  // ── Data ────────────────────────────────────────────────────────
  /** Data loader. */
  readonly load?: (args: {
    readonly params: Readonly<TParams>;
    readonly request: Request;
  }) => Promise<TData> | TData;

  /**
   * Colocated module — the framework's route adapter reads both
   * `default` (the component) and `page` (the config) from the
   * imported module.
   */
  readonly lazy?: () => Promise<Record<string, unknown>>;

  // ── Gates & pipeline ────────────────────────────────────────────
  /** Guards to run before the route renders (concatenated w/ parent). */
  readonly guards?: readonly unknown[];

  /** Middleware run for the route (concatenated w/ parent). */
  readonly middleware?: readonly unknown[];

  /** Access shortcut — sugar over guards. */
  readonly access?: IAccessSpec;

  // ── SEO ─────────────────────────────────────────────────────────
  /** SEO descriptor — static or function of the page context. */
  readonly seo?: unknown | ((ctx: IPageContext<TData, TParams>) => unknown);

  // ── Prerender ───────────────────────────────────────────────────
  /** Prerender specification. */
  readonly prerender?: IPrerenderSpec<TParams & Record<string, string>>;

  // ── Extras ──────────────────────────────────────────────────────
  /** Breadcrumb entry (string or function). */
  readonly breadcrumb?: string | ((ctx: IPageContext<TData, TParams>) => string);

  /** Analytics event fired on navigation. */
  readonly analytics?: unknown | ((ctx: IPageContext<TData, TParams>) => unknown);

  // ── Presentation mode ───────────────────────────────────────────
  /** Route mode (`page` / `dialog` / `drawer` / `sheet`). */
  readonly mode?: IRouteMode;

  /** Overlay configuration — only used when `mode !== 'page'`. */
  readonly overlay?: IOverlayConfig;

  // ── Advanced matchers ───────────────────────────────────────────
  /** Pluggable predicate matchers. */
  readonly match?: IRouteMatchSpec;

  // ── Extra head tags ─────────────────────────────────────────────
  /** Extra `<link>` tags contributed to the document head. */
  readonly head?:
    readonly ILinkTag[] | ((ctx: IPageContext<TData, TParams>) => readonly ILinkTag[]);

  // ── History ─────────────────────────────────────────────────────
  /** History-control descriptor. */
  readonly history?: IRouteHistory;
}
