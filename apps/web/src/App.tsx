/**
 * @file App.tsx
 * @module App
 *
 * @description
 * The route tree. Three tiers:
 *
 * 1. **Public** — the landing page (`/`) and login (`/login`). The login route
 *    is wrapped so an already-authenticated user is bounced to the dashboard.
 * 2. **Authenticated** — everything under the {@link AuthenticatedLayout} shell,
 *    guarded by Refine's `<Authenticated>`; unauthenticated users are redirected
 *    to `/login` via `CatchAllNavigate`.
 * 3. **Catch-all** — a 404 for anything unmatched.
 *
 * ## Code splitting
 * The public landing and 404 are eager (fast first paint). Everything that
 * pulls in the heavy HeroUI Pro shell (AppLayout, Sidebar, Navbar, DataGrid) —
 * i.e. the authenticated layout and pages, plus the login form — is
 * **lazy-loaded** so it never inflates the initial bundle. A single `Suspense`
 * boundary renders a spinner while a route chunk loads.
 *
 * Resource routes come from `@/config/resources`; only `students` has a bespoke
 * page today — the rest render {@link ComingSoonPage} until built out.
 */

import { Spinner } from "@academorix/ui/react";
import { Authenticated } from "@refinedev/core";
import { CatchAllNavigate, NavigateToResource } from "@refinedev/react-router";
import { lazy, Suspense } from "react";
import { Outlet, Route, Routes } from "react-router";

import type { ReactNode } from "react";

import { routes } from "@/config/routes";
import { HomePage } from "@/pages/home";
import { NotFoundPage } from "@/pages/not-found";

// Heavy, auth-only chunks — loaded on demand, not in the initial bundle.
const AuthenticatedLayout = lazy(() =>
  import("@/components/layout/authenticated-layout").then((module) => ({
    default: module.AuthenticatedLayout,
  })),
);
const LoginPage = lazy(() =>
  import("@/pages/login").then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((module) => ({ default: module.DashboardPage })),
);
const StudentsListPage = lazy(() =>
  import("@/pages/students/list").then((module) => ({ default: module.StudentsListPage })),
);
const ComingSoonPage = lazy(() =>
  import("@/pages/coming-soon").then((module) => ({ default: module.ComingSoonPage })),
);

/** Full-viewport spinner shown while a lazy route chunk loads. */
function RouteFallback(): ReactNode {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner aria-label="Loading" size="lg" />
    </div>
  );
}

/** Top-level application routes. */
export function App(): ReactNode {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public landing page. */}
        <Route index element={<HomePage />} />

        {/* Public login — redirect to the dashboard if already signed in. */}
        <Route
          element={
            <Authenticated key="auth-pages" fallback={<Outlet />}>
              <NavigateToResource resource="dashboard" />
            </Authenticated>
          }
        >
          <Route element={<LoginPage />} path={routes.login} />
        </Route>

        {/* Authenticated area — gated and wrapped in the app shell. */}
        <Route
          element={
            <Authenticated key="protected" fallback={<CatchAllNavigate to={routes.login} />}>
              <AuthenticatedLayout>
                <Outlet />
              </AuthenticatedLayout>
            </Authenticated>
          }
        >
          <Route element={<DashboardPage />} path={routes.dashboard} />
          <Route element={<StudentsListPage />} path={routes.students} />
          <Route element={<ComingSoonPage />} path={routes.coaches} />
          <Route element={<ComingSoonPage />} path={routes.courses} />
          <Route element={<ComingSoonPage />} path={routes.teams} />
          <Route element={<ComingSoonPage />} path={routes.branches} />
        </Route>

        {/* Catch-all 404. */}
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  );
}
