/**
 * @file notifications.module.tsx
 * @module modules/notifications
 *
 * @description
 * The Notification Templates module manifest — multi-channel delivery templates
 * (email/SMS/push/in-app) with per-tenant overrides. Registered as a placeholder
 * (nav entry + coming-soon page) until its build wave.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.11 "Notification Delivery & Templates"
 */

import { BellAlertIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const ComingSoonPage = lazy(() => import("@/components/coming-soon"));

/** The Notification Templates feature module (placeholder). */
const notificationsModule: AppModule = {
  name: "notifications",
  resources: [
    {
      name: "notification-templates",
      list: "/notification-templates",
      meta: {
        label: "Notifications",
        icon: BellAlertIcon,
        featureKey: "notification-templates",
        requiredPermission: "notification-templates.viewAny",
        order: 97,
      },
    },
  ],
  routes: [
    { tier: "protected", path: "/notification-templates", element: createElement(ComingSoonPage) },
  ],
};

export default notificationsModule;
