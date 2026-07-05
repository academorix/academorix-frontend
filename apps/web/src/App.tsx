/**
 * @file App.tsx
 * @module App
 *
 * @description
 * The route tree, assembled entirely from the module {@link "@/lib/module" registry} —
 * `App.tsx` imports no feature code directly. Three tiers:
 *
 * 1. **Public** — routes flagged `tier: "public"` (landing, login, workspace
 *    picker). A public route may set `redirectAuthenticatedTo` so signed-in
 *    users are bounced away (login → dashboard).
 * 2. **Protected** — routes flagged `tier: "protected"`, rendered inside the
 *    {@link AuthenticatedLayout} shell and guarded by Refine's `<Authenticated>`;
 *    unauthenticated users are sent to `/login`.
 * 3. **Catch-all** — a 404 for anything unmatched.
 *
 * Routes may also carry a `hosts` filter so central-host workspace pages stay
 * out of tenant subdomains and vice versa (see `lib/module/registry`).
 *
 * The whole tree is wrapped in {@link TenancyProvider} so every page (public or
 * protected) knows the workspace context; the {@link ScopeProvider} runs
 * inside `<Authenticated>` because the org/branch/season selection depends on
 * the identity.
 */

import { Spinner } from "@academorix/ui/react";
import { Authenticated } from "@refinedev/core";
import { CatchAllNavigate } from "@refinedev/react-router";
import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";

import type { AppModuleRoute } from "@/lib/module";
import type { ReactNode } from "react";

import { NotFoundPage } from "@/components/not-found";
import { appRoutes, protectedRoutes, publicRoutes } from "@/lib/module";
import { ScopeProvider } from "@/lib/scope";
import { TenancyProvider } from "@/lib/tenancy";

/**
 * The authenticated app shell — lazy so its heavy HeroUI Pro chunk (AppLayout,
 * Sidebar, Navbar, Dropdown) stays out of the initial bundle.
 */
const AuthenticatedLayout = lazy(() =>
  import("@/components/layout/authenticated-layout").then((module) => ({
    default: module.AuthenticatedLayout,
  })),
);

/** Full-viewport spinner shown while a lazy route chunk loads. */
function RouteFallback(): ReactNode {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner aria-label="Loading" size="lg" />
    </div>
  );
}

/** Renders a module route as an index or path `<Route>` (never both). */
function leafRoute(route: AppModuleRoute, key: string): ReactNode {
  return route.index ? (
    <Route key={key} index element={route.element} />
  ) : (
    <Route key={key} element={route.element} path={route.path} />
  );
}

/**
 * Renders a public route, optionally wrapped so authenticated visitors are
 * redirected away (e.g. `/login` → `/dashboard`).
 */
function publicRoute(route: AppModuleRoute, key: string): ReactNode {
  const leaf = leafRoute(route, key);

  if (!route.redirectAuthenticatedTo) {
    return leaf;
  }

  return (
    <Route
      key={`${key}-guard`}
      element={
        <Authenticated key={`${key}-auth`} fallback={<Outlet />}>
          <Navigate replace to={route.redirectAuthenticatedTo} />
        </Authenticated>
      }
    >
      {leaf}
    </Route>
  );
}

/** Top-level application routes, assembled from the module registry. */
export function App(): ReactNode {
  return (
    <TenancyProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public routes (landing, login, workspace picker, forgot/reset/…). */}
          {publicRoutes.map((route, index) => publicRoute(route, `public-${index}`))}

          {/* Authenticated area — gated and wrapped in the app shell. */}
          <Route
            element={
              <Authenticated key="protected" fallback={<CatchAllNavigate to={appRoutes.login} />}>
                <ScopeProvider>
                  <AuthenticatedLayout>
                    <Outlet />
                  </AuthenticatedLayout>
                </ScopeProvider>
              </Authenticated>
            }
          >
            {protectedRoutes.map((route, index) => leafRoute(route, `protected-${index}`))}
          </Route>

          {/* Catch-all 404. */}
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </TenancyProvider>
  );
}
