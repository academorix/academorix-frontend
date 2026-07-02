/**
 * @file auth.module.tsx
 * @module modules/auth
 *
 * @description
 * Auth module manifest: contributes the public `/login` route. Authenticated
 * visitors are redirected to the dashboard (the module owns that behavior via
 * `redirectAuthenticatedTo`).
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { appRoutes } from "@/lib/module";

const LoginPage = lazy(() => import("@/modules/auth/pages/login-page"));

const authModule: AppModule = {
  name: "auth",
  routes: [
    {
      tier: "public",
      path: appRoutes.login,
      element: createElement(LoginPage),
      redirectAuthenticatedTo: appRoutes.dashboard,
    },
  ],
};

export default authModule;
