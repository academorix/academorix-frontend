/**
 * @file react-router-re-exports.ts
 * @module @stackra/routing/react
 * @description Curated re-exports of the RRv7 React primitives.
 *
 *   Consumers of `@stackra/routing/react` import RRv7's core hooks
 *   and components from THIS subpath so they never need a direct
 *   dependency on `react-router`. The re-export list matches PLAN
 *   §19's aliased-surface table.
 *
 *   Runtime symbols only — RRv7 TYPE aliases live in the dedicated
 *   `@stackra/routing/rrv7` subpath (per PLAN v3.9.6).
 */

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
} from "react-router";
