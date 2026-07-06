/**
 * @file routes.ts
 * @module lib/module/routes
 *
 * @description
 * Cross-cutting route paths referenced outside any single feature module —
 * chiefly auth provider redirect targets, host-specific landing pages, and the
 * Slack-style workspace picker. Feature modules define their own resource
 * paths inside their manifests; only genuinely shared destinations belong here.
 */

/** Shared, cross-module route destinations. */
export const appRoutes = {
  /** Public landing page (tenant host) / workspace picker (central host). */
  home: "/",
  /** Default post-login destination. */
  dashboard: "/dashboard",

  // --- Tenant auth surface (served under `{slug}.academorix.app`) ------
  /** Public login screen. */
  login: "/login",
  /** Public registration / sign-up screen. */
  register: "/register",
  /** Public "email me a reset link" form. */
  forgotPassword: "/forgot-password",
  /** Public reset-password form (target of the emailed link). */
  resetPassword: "/reset-password",
  /** Landing page for the emailed verify-email signed link. */
  verifyEmail: "/verify-email",
  /** Protected page shown when the caller's email is not yet verified. */
  verifyEmailNotice: "/verify-email-notice",
  /** Protected "re-enter your password" step-up form. */
  confirmPassword: "/settings/security/confirm-password",
  /** Protected "change my password" form. */
  changePassword: "/settings/security/change-password",

  // --- Platform admin auth surface (served under `admin.academorix.app`) ----
  /** Initial 2FA enrolment screen (mandatory for platform admins). */
  twoFactorSetup: "/2fa/setup",
  /** Post-login 2FA challenge (subsequent sign-ins). */
  twoFactorChallenge: "/2fa/challenge",
  /** Recovery codes management screen. */
  twoFactorRecoveryCodes: "/settings/security/recovery-codes",

  // --- Central host (workspace picker + self-serve tenant creation) --------
  /** Landing page for anonymous visitors on the central host. */
  workspacePicker: "/",
  /** "Find my workspaces" — email me the list. */
  findWorkspaces: "/find-workspaces",
  /** Self-serve tenant/workspace creation. */
  createWorkspace: "/create-workspace",
} as const;

/** Union of the shared route path strings. */
export type AppRoutePath = (typeof appRoutes)[keyof typeof appRoutes];
