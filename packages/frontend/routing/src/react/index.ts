/**
 * @file index.ts
 * @module @stackra/routing/react
 * @description Public API of the `@stackra/routing/react` subpath.
 *
 *   Exports every React-side symbol consumers need — providers,
 *   components, hooks, adapter utils, devtools contributions, and
 *   curated re-exports of the RRv7 primitives.
 *
 *   Never re-exports from `@stackra/contracts` — consumers reach the
 *   contracts directly (per `contract-reexports.md`).
 */

// ── Providers ───────────────────────────────────────────────────
export {
  StackraRoutingProvider,
  type IStackraRoutingProviderProps,
} from "./providers/stackra-routing";
export { OverlayProvider } from "./providers/overlay";

// ── Contexts (readable — writing is via providers only) ─────────
export { StackraRoutingContext } from "./contexts/stackra-routing";
export type { IStackraRoutingContext, IStackraRouter } from "./contexts/stackra-routing";
export { OverlayContext } from "./contexts/overlay";
export type { IOverlayContext, IOverlayEntry } from "./contexts/overlay";

// ── Adapter utils (public — used by tests + build tooling) ──────
export {
  adaptPageModule,
  adaptLayoutModule,
  toRrv7Routes,
  extractBasicMetaTags,
  type IPageModule,
  type ILayoutModule,
  type IRrvMetaTag,
} from "./adapt-page-module";

// ── Components ──────────────────────────────────────────────────
export { A11yAnnouncer } from "./components/a11y-announcer";
export { AiRouteContext } from "./components/ai-route-context";
export { Breadcrumbs, type IBreadcrumbsProps } from "./components/breadcrumbs";
export { Link, type ILinkProps, type ILinkPrefetch } from "./components/link";
export { Links } from "./components/links";
export { OverlayOutlet } from "./components/overlay-outlet";
export { Scripts } from "./components/scripts";
export { SeoHead, type ISeoHeadProps } from "./components/seo-head";

// ── Framework-default fallbacks ─────────────────────────────────
export {
  DefaultLoadingFallback,
  type IDefaultLoadingFallbackProps,
  DefaultPendingFallback,
  type IDefaultPendingFallbackProps,
  DefaultEmptyFallback,
  type IDefaultEmptyFallbackAction,
  type IDefaultEmptyFallbackProps,
  DefaultNotFoundFallback,
  type IDefaultNotFoundFallbackAction,
  type IDefaultNotFoundFallbackProps,
  DefaultErrorFallback,
} from "./components/fallbacks";

// ── Hooks ───────────────────────────────────────────────────────
export {
  useStackraRoutingContext,
  useNavigate,
  useCurrentMatch,
  type ICurrentMatch,
  useRouteData,
  useCanGoBack,
  useHistoryStack,
  type IHistoryEntry,
  useBack,
  useBreadcrumbs,
  type IBreadcrumbEntry,
  useBreadcrumb,
  useRouteMode,
  useRouteAnalytics,
  useRouteState,
  useRouteQueryState,
  type IRouteQueryStateOptions,
  useAiRouteContext,
  useMediaQuery,
  type IUseMediaQueryOptions,
} from "./hooks";

// ── Devtools contributions ──────────────────────────────────────
export {
  RoutingDevtoolsPanel,
  RoutingDevtoolsPanelView,
  type IRoutingDevtoolsPanelViewProps,
  RoutingInspectorSource,
} from "./devtools";

// ── Curated RRv7 re-exports ─────────────────────────────────────
export {
  Outlet,
  Navigate,
  useLocation,
  useMatches,
  useMatch,
  useParams,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useRouteError,
  isRouteErrorResponse,
  RouterProvider,
  useRevalidator,
  useHref,
  useInRouterContext,
} from "./react-router-re-exports";
