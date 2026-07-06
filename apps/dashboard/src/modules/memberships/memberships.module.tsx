/**
 * @file memberships.module.tsx
 * @module modules/memberships
 *
 * @description
 * The Memberships module — recurring subscriptions (academy → member). Full CRUD,
 * scoped by branch.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.5 "Recurring Membership & Subscriptions"
 */

import { CreditCardIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const MembershipListPage = lazy(() => import("@/modules/memberships/pages/list"));
const MembershipCreatePage = lazy(() => import("@/modules/memberships/pages/create"));
const MembershipEditPage = lazy(() => import("@/modules/memberships/pages/edit"));
const MembershipShowPage = lazy(() => import("@/modules/memberships/pages/show"));

/** The Memberships feature module. */
const membershipsModule: AppModule = {
  name: "memberships",
  resources: [
    {
      name: "memberships",
      list: "/memberships",
      create: "/memberships/create",
      edit: "/memberships/:id/edit",
      show: "/memberships/:id",
      meta: {
        label: "Memberships",
        icon: CreditCardIcon,
        featureKey: "memberships",
        requiredPermission: "memberships.viewAny",
        order: 31,
        scopedBy: ["branch"],
        groupKey: "growth",
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/memberships", element: createElement(MembershipListPage) },
    {
      tier: "protected",
      path: "/memberships/create",
      element: createElement(MembershipCreatePage),
    },
    {
      tier: "protected",
      path: "/memberships/:id/edit",
      element: createElement(MembershipEditPage),
    },
    { tier: "protected", path: "/memberships/:id", element: createElement(MembershipShowPage) },
  ],
};

export default membershipsModule;
