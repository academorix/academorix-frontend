/**
 * @file settings.module.ts
 * @module modules/settings/settings.module
 *
 * @description
 * The Settings module manifest — one resource (`settings`) with two routes:
 *
 *   - `/settings` — redirects to `/settings/general`.
 *   - `/settings/:sectionId` — the single generic settings page that reads
 *     its section from the URL and renders every field in the JSON schema
 *     that belongs to it.
 *
 * The 16 settings tabs (General, Branding, Locale & region, …) live entirely
 * in `src/refine/data/settings-schema.json`. Adding, renaming, or reordering
 * a tab is a JSON edit — no code changes are needed.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const IndexPage = lazy(() => import("./pages/list"));
const SectionPage = lazy(() => import("./pages/section"));
const SecurityPage = lazy(() => import("./pages/security/security-page"));
const ProfilePage = lazy(() => import("./pages/profile/profile-page"));
const SsoPage = lazy(() => import("./pages/sso/sso-page"));

const settingsModule: AppModule = {
  name: "settings",
  resources: [
    {
      name: "settings",
      list: "/settings",
      meta: {
        label: "Settings",
        icon: "gear",
        groupKey: "administration",
        order: 100,
        featureKey: "settings",
        requiredPermission: "settings.viewAny",
        shortcuts: { navigate: "G ," },
        crud: "list-only",
      },
    },
  ],
  routes: [
    { element: createElement(IndexPage), path: "/settings", tier: "protected" },
    // WHY the explicit `/settings/security` + `/settings/profile`
    // routes: both are hand-authored surfaces (password / sessions /
    // two-factor / recovery codes for security; name + email + phone
    // for profile) rather than JSON-schema-driven sections, so they
    // need their own pages. Registered before the catch-all
    // `/:sectionId` route so React Router matches these first.
    // `/settings/sso` follows the same pattern — it renders its own
    // page (identity-provider list + wizards) instead of a JSON
    // schema-driven section.
    { element: createElement(SecurityPage), path: "/settings/security", tier: "protected" },
    { element: createElement(ProfilePage), path: "/settings/profile", tier: "protected" },
    { element: createElement(SsoPage), path: "/settings/sso", tier: "protected" },
    { element: createElement(SectionPage), path: "/settings/:sectionId", tier: "protected" },
  ],
};

export default settingsModule;
