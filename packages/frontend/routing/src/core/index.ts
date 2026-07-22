/**
 * @file index.ts
 * @module @stackra/routing/core
 * @description Public API for the `@stackra/routing` core (F.1).
 *
 *   Aggregates the framework-general surface — the composite
 *   `RoutingModule`, the shared services + config trio, the
 *   `define*()` authoring helpers — AND re-exports the sibling
 *   sub-domain modules (middleware, guards, seo, analytics) so
 *   consumers who import from the top-level `@stackra/routing`
 *   entry keep seeing every symbol they used to.
 *
 *   Never re-exports from `@stackra/contracts` — consumers reach the
 *   contracts directly (per `contract-reexports.md`).
 */

// ── Composite module ────────────────────────────────────────────
export { RoutingModule } from "./routing.module";

// ── Sub-modules (siblings) ──────────────────────────────────────
export { MiddlewareModule } from "@/middleware";
export { GuardModule } from "@/guards";
export { SeoModule } from "@/seo";
export { AnalyticsModule } from "@/analytics";

// ── Core services ───────────────────────────────────────────────
export { RouteRegistryService, RouteMatcherService, AiRouteContextService } from "./services";

// ── Middleware subsystem re-exports ─────────────────────────────
export {
  MiddlewareRegistryService,
  MiddlewareResolverService,
  MiddlewareLoader,
  RedirectSignal,
  NotFoundSignal,
  MiddlewareAbortSignal,
  redirect,
  notFound,
  abort,
  MiddlewareCycleDetectedError,
} from "@/middleware";

// ── Guard subsystem re-exports ──────────────────────────────────
export { GuardRegistryService, GuardAdapterService, GuardLoader } from "@/guards";

// ── SEO subsystem re-exports ────────────────────────────────────
export { SeoService } from "@/seo";

// ── Analytics subsystem re-exports ──────────────────────────────
export { RouteAnalyticsService } from "@/analytics";

// ── Config authoring helpers ────────────────────────────────────
export {
  /** @deprecated Import `registerAs` from `@stackra/config`. Removed in v0.2. */
  defineConfig,
  /** @deprecated Import `registerAs` from `@stackra/config`. Removed in v0.2. */
  defineRoutingConfig,
  defineRoute,
  defineLayout,
  definePage,
  defineRouterConfig,
  mergeConfig,
  resolveValue,
  slugify,
} from "./utils";

// ── Errors ──────────────────────────────────────────────────────
export { RouteNotFoundError, UnmatchedRouteError } from "./errors";

// ── Constants ───────────────────────────────────────────────────
export {
  DEFAULT_ROUTING_CONFIG,
  STACKRA_HANDLE,
  DEFAULT_GUARD_PRIORITY,
  DEFAULT_MIDDLEWARE_PRIORITY,
} from "./constants";
export type { STACKRA_HANDLE_KEY } from "./constants";

// ── Package-owned interfaces (internal shapes) ──────────────────
export type {
  IGuardEntry,
  IMiddlewareEntry,
  IMiddlewareGroup,
  IPipelineEntryKind,
  IPipelineResolutionInput,
  IResolvedPipelineEntry,
} from "./interfaces";

// ── SEO interfaces (owned by routing) ───────────────────────────
export type {
  IAlternateLink,
  IJsonLd,
  IOpenGraphImage,
  IOpenGraphTags,
  IRobotsDirective,
  ISeoConfig,
  ISeoDescriptor,
  ISeoTag,
  ITwitterTags,
} from "@/seo";
