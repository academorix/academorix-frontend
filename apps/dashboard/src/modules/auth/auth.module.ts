/**
 * @file auth.module.ts
 * @module modules/auth
 *
 * @description
 * Module manifest for the auth surfaces. Registers every
 * unauthenticated page as `tier: "public"` so the router mounts them
 * inside `<App>` (providers + theme + toast) but outside `<AppShell>`
 * (no sidebar / navbar).
 *
 * ## Route list
 *
 *   - `/sign-in`         — multi-step Slack-style sign-in
 *                          (workspace → email → password → 2FA).
 *   - `/sign-up`         — new workspace creation (central host only).
 *   - `/find-workspaces` — Slack-style workspace recovery.
 *   - `/forgot-password` — reset-email request.
 *   - `/reset-password`  — reset-email consumer (`?token=&email=`).
 *   - `/verify-email`    — email verification landing
 *                          (`?id=&hash=&signature=&expires=`).
 *   - `/sso/callback`    — SSO handoff exchange
 *                          (`?token=&expires_at=`). Reads the
 *                          one-time PAT the SAML ACS / OIDC
 *                          callback minted and trades it for a
 *                          long-lived Sanctum session token.
 *   - `/join/:token`     — invite-acceptance for new team members.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const SignInPage = lazy(() => import("./pages/sign-in"));
const SignUpPage = lazy(() => import("./pages/sign-up"));
const FindWorkspacesPage = lazy(() => import("./pages/find-workspaces"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("./pages/reset-password"));
const VerifyEmailPage = lazy(() => import("./pages/verify-email"));
const SsoCallbackPage = lazy(() => import("./pages/sso-callback"));
const JoinPage = lazy(() => import("./pages/join"));

const authModule: AppModule = {
  name: "auth",
  routes: [
    { element: createElement(SignInPage), path: "/sign-in", tier: "public" },
    { element: createElement(SignUpPage), path: "/sign-up", tier: "public" },
    { element: createElement(FindWorkspacesPage), path: "/find-workspaces", tier: "public" },
    { element: createElement(ForgotPasswordPage), path: "/forgot-password", tier: "public" },
    { element: createElement(ResetPasswordPage), path: "/reset-password", tier: "public" },
    { element: createElement(VerifyEmailPage), path: "/verify-email", tier: "public" },
    { element: createElement(SsoCallbackPage), path: "/sso/callback", tier: "public" },
    { element: createElement(JoinPage), path: "/join/:token", tier: "public" },
  ],
};

export default authModule;
