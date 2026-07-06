/**
 * @file settings.module.tsx
 * @module modules/settings
 *
 * @description
 * The Settings module manifest — the workspace configuration surface. Ships
 * one Refine resource named `settings` (visible in the primary sidebar as
 * "Settings" under the Administration group) and seventeen routes: one
 * redirect at `/settings` plus one page per section under `/settings/<id>`.
 *
 * Phase 4a ships the routing, the secondary sidebar, the section layout, and
 * a functional General page. The other fifteen sections render a "Coming
 * soon" placeholder inside the same shell so operators can bookmark them
 * today. Phase 4b turns each placeholder into a wired form backed by the
 * tenant-settings resource (see `DASHBOARD_UX_PLAN.md` §9.3).
 */

import { Cog6ToothIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";
import { Navigate } from "react-router";

import type { AppModule } from "@/lib/module";

import { createPlaceholderPage } from "@/modules/settings/pages/placeholder";
import { settingsSections } from "@/modules/settings/settings.sections";

const GeneralSettingsPage = lazy(() => import("@/modules/settings/pages/general"));

/**
 * Builds a page element for a section id. Uses the shipped page component
 * when one exists (currently: General), or the shared placeholder factory
 * otherwise so every route in the manifest resolves to a live page.
 */
function pageElementForSection(id: string): ReturnType<typeof createElement> {
  if (id === "general") {
    return createElement(GeneralSettingsPage);
  }

  const Placeholder = createPlaceholderPage(id as (typeof settingsSections)[number]["id"]);

  return createElement(Placeholder);
}

/** The Settings feature module. */
const settingsModule: AppModule = {
  name: "settings",
  resources: [
    {
      name: "settings",
      list: "/settings",
      meta: {
        label: "Settings",
        icon: Cog6ToothIcon,
        featureKey: "settings",
        requiredPermission: "settings.viewAny",
        order: 100,
        groupKey: "administration",
        shortcuts: {
          navigate: "G ,",
        },
      },
    },
  ],
  routes: [
    // Root — redirect to the General section so a bare `/settings` URL lands
    // somewhere useful without a spinner.
    {
      tier: "protected",
      path: "/settings",
      element: createElement(Navigate, { replace: true, to: "/settings/general" }),
    },
    // One route per section descriptor. Order does not matter here; the
    // sidebar drives display order from `settings.sections.ts`.
    ...settingsSections.map((section) => ({
      tier: "protected" as const,
      path: `/settings/${section.id}`,
      element: pageElementForSection(section.id),
    })),
  ],
};

export default settingsModule;
