/**
 * @file auth.module.tsx
 * @module modules/auth
 *
 * @description
 * Auth module manifest: contributes the public + protected auth surfaces for
 * both the tenant and platform admin hosts. Refine's `<Authenticated>` guard
 * enforces the tier — public routes redirect signed-in users to the dashboard
 * via `redirectAuthenticatedTo`, and protected routes redirect anonymous users
 * to `/login`.
 *
 * See PLAN.md §5 for the full flow map.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

import { appRoutes } from "@/lib/module/routes";

// --- Public auth pages ---------------------------------------------------
const LoginPage = lazy(() => import("@/modules/auth/pages/login-page"));
const RegisterPage = lazy(() => import("@/modules/auth/pages/register-page"));
const ForgotPasswordPage = lazy(() => import("@/modules/auth/pages/forgot-password-page"));
const ResetPasswordPage = lazy(() => import("@/modules/auth/pages/reset-password-page"));
const VerifyEmailPage = lazy(() => import("@/modules/auth/pages/verify-email-page"));
const TwoFactorChallengePage = lazy(() => import("@/modules/auth/pages/two-factor-challenge-page"));
const TwoFactorSetupPage = lazy(() => import("@/modules/auth/pages/two-factor-setup-page"));
const TenantIndexRedirect = lazy(() => import("@/modules/auth/pages/tenant-index-redirect"));

// --- Protected auth pages ------------------------------------------------
const VerifyEmailNoticePage = lazy(() => import("@/modules/auth/pages/verify-email-notice-page"));
const ConfirmPasswordPage = lazy(() => import("@/modules/auth/pages/confirm-password-page"));
const ChangePasswordPage = lazy(() => import("@/modules/auth/pages/change-password-page"));

const authModule: AppModule = {
  name: "auth",
  routes: [
    // Tenant-host `/` → redirect to /login (marketing content moved to
    // apps/landing-page). Central hosts have their own index route via
    // the workspace module (workspace picker).
    {
      tier: "public",
      index: true,
      element: createElement(TenantIndexRedirect),
      hosts: ["tenant"],
      redirectAuthenticatedTo: appRoutes.dashboard,
    },
    // Public — anonymous callers only (auth'd users bounced to dashboard).
    {
      tier: "public",
      path: appRoutes.login,
      element: createElement(LoginPage),
      redirectAuthenticatedTo: appRoutes.dashboard,
    },
    {
      tier: "public",
      path: appRoutes.register,
      element: createElement(RegisterPage),
      redirectAuthenticatedTo: appRoutes.dashboard,
    },
    {
      tier: "public",
      path: appRoutes.forgotPassword,
      element: createElement(ForgotPasswordPage),
    },
    {
      tier: "public",
      path: appRoutes.resetPassword,
      element: createElement(ResetPasswordPage),
    },
    {
      tier: "public",
      path: appRoutes.verifyEmail,
      element: createElement(VerifyEmailPage),
    },
    {
      tier: "public",
      path: appRoutes.twoFactorChallenge,
      element: createElement(TwoFactorChallengePage),
    },
    // Protected — requires an authenticated session (restricted enrolment
    // token is fine — the setup page short-circuits when the API is null).
    {
      tier: "protected",
      path: appRoutes.twoFactorSetup,
      element: createElement(TwoFactorSetupPage),
    },
    {
      tier: "protected",
      path: appRoutes.verifyEmailNotice,
      element: createElement(VerifyEmailNoticePage),
    },
    {
      tier: "protected",
      path: appRoutes.confirmPassword,
      element: createElement(ConfirmPasswordPage),
    },
    {
      tier: "protected",
      path: appRoutes.changePassword,
      element: createElement(ChangePasswordPage),
    },
  ],
};

export default authModule;
