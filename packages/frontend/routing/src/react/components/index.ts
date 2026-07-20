/**
 * @file index.ts
 * @module @stackra/routing/react/components
 * @description Barrel for the routing subpath's React components.
 */

export { A11yAnnouncer } from "./a11y-announcer";
export { AiRouteContext } from "./ai-route-context";
export { Breadcrumbs, type IBreadcrumbsProps } from "./breadcrumbs";
export { Link, type ILinkProps, type ILinkPrefetch } from "./link";
export { Links } from "./links";
export { OverlayOutlet } from "./overlay-outlet";
export { Scripts } from "./scripts";
export { SeoHead, type ISeoHeadProps } from "./seo-head";

// Framework-default fallbacks.
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
} from "./fallbacks";
