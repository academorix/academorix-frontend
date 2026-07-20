/**
 * @file index.ts
 * @module @stackra/routing/react/hooks
 * @description Barrel for the routing hooks category.
 */

export { useStackraRoutingContext } from "./use-stackra-routing-context";
export { useNavigate } from "./use-navigate";
export { useCurrentMatch, type ICurrentMatch } from "./use-current-match";
export { useRouteData } from "./use-route-data";
export { useCanGoBack } from "./use-can-go-back";
export { useHistoryStack, type IHistoryEntry } from "./use-history-stack";
export { useBack } from "./use-back";
export { useBreadcrumbs, type IBreadcrumbEntry } from "./use-breadcrumbs";
export { useBreadcrumb } from "./use-breadcrumb";
export { useRouteMode } from "./use-route-mode";
export { useRouteAnalytics } from "./use-route-analytics";
export { useRouteState } from "./use-route-state";
export { useRouteQueryState, type IRouteQueryStateOptions } from "./use-route-query-state";
export { useAiRouteContext } from "./use-ai-route-context";
export { useMediaQuery, type IUseMediaQueryOptions } from "./use-media-query";
