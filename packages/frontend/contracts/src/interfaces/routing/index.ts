/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Public API barrel for routing contract interfaces.
 *
 *   Stackra-owned shapes only — RRv7-native type re-exports live in
 *   `@stackra/routing/rrv7`. Contracts stays zero-runtime and depends
 *   on `react-router` only as a type-only devDependency (for
 *   `import type { RouteObject }` inside `route-record.interface.ts`).
 */

// ── Access + gating ─────────────────────────────────────────────────
export type { IAccessSpec } from "./access-spec.interface";
export type { ICanActivate } from "./can-activate.interface";
export type { IGuardOptions } from "./guard-options.interface";
export type { IGuardContext } from "./guard-context.interface";
export type { IGuardDecision } from "./guard-decision.type";
export type { IMiddleware, IMiddlewareContext, IMiddlewareNext } from "./middleware.interface";
export type { IMiddlewareOptions } from "./middleware-options.interface";

// ── Matchers ─────────────────────────────────────────────────────────
export type { IMatcherContext } from "./matcher-context.interface";
export type { ISubdomainPredicate } from "./subdomain-predicate.interface";
export type { IQueryPredicate } from "./query-predicate.interface";
export type { IHeaderPredicate } from "./header-predicate.interface";
export type { IHashPredicate } from "./hash-predicate.interface";
export type { ISubdomainMatchers } from "./subdomain-matchers.interface";
export type { IQueryMatchers } from "./query-matchers.interface";
export type { IHeaderMatchers } from "./header-matchers.interface";
export type { IHashMatchers } from "./hash-matchers.interface";

// ── Match + navigation ──────────────────────────────────────────────
export type { IMatchDescriptor } from "./match-descriptor.interface";
export type { INavigateOptions } from "./navigate-options.interface";

// ── Page + layout config ────────────────────────────────────────────
export type { IPageConfig, ILoaderArgs, IRevalidateContext } from "./page-config.interface";
export type { IPageContext } from "./page-context.interface";
export type { ILayoutConfig } from "./layout-config.interface";
export type { IPrerenderContext } from "./prerender-context.interface";

// ── Route record + router config ────────────────────────────────────
export type { IRouteRecord, IRouteMatchSpec, IPrerenderSpec } from "./route-record.interface";
export type { IRouterConfig } from "./router-config.interface";

// ── Module options ──────────────────────────────────────────────────
export type { IRoutingModuleOptions, IDevMode } from "./routing-module-options.interface";
export type { IRoutingFeatureOptions } from "./routing-feature-options.interface";

// ── Presentation ────────────────────────────────────────────────────
export type { IRouteMode } from "./route-mode.interface";
export type { IOverlayConfig } from "./overlay-config.interface";

// ── Head / error / history ──────────────────────────────────────────
export type { ILinkTag } from "./link-tag.interface";
export type { IErrorProps } from "./error-props.interface";
export type { IRouteHistory } from "./route-history.interface";
export type { IHistoryOnBack } from "./history-on-back.type";

// ── Signals ─────────────────────────────────────────────────────────
export type { IRedirectSignal } from "./redirect-signal.interface";
export type { INotFoundSignal } from "./not-found-signal.interface";
export type { IAbortSignal } from "./abort-signal.interface";
